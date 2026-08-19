import { expect, test } from '@playwright/test';

const documentationRoutes = [
  '/',
  '/starter-guide',
  '/specification',
  '/skill-creation/quickstart',
  '/skill-creation/best-practices',
  '/skill-creation/optimizing-descriptions',
  '/skill-creation/evaluating-skills',
  '/skill-creation/using-scripts',
  '/client-implementation/adding-skills-support',
];

test('documentation routes and anchors render', async ({ request, page }) => {
  for (const route of documentationRoutes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }

  await page.goto('/#what-are-agent-skills');
  await expect(page.locator('#what-are-agent-skills')).toBeVisible();
});

test('machine-readable routes expose documentation', async ({ request }) => {
  const markdown = await request.get('/specification.md');
  expect(markdown.status()).toBe(200);
  expect(markdown.headers()['content-type']).toContain('text/markdown');
  expect(await markdown.text()).toContain('# 规范');

  const indexMarkdown = await request.get('/index.md');
  expect(indexMarkdown.status()).toBe(200);
  expect(await indexMarkdown.text()).toContain('# Agent Skills 概览');

  const llmsIndex = await request.get('/llms.txt');
  expect(llmsIndex.status()).toBe(200);
  expect(llmsIndex.headers()['content-type']).toContain('text/plain');
  expect(await llmsIndex.text()).toContain('/starter-guide');

  const llmsFull = await request.get('/llms-full.txt');
  expect(llmsFull.status()).toBe(200);
  expect(await llmsFull.text()).toContain('# 定制这个模板');

  const search = await request.get(
    '/api/search?query=%E6%B8%90%E8%BF%9B%E5%BC%8F%E6%8A%AB%E9%9C%B2',
  );
  expect(search.status()).toBe(200);
  expect(await search.text()).toContain('Agent Skills 概览');
});

test('optional services are safe when unconfigured', async ({ request, page }) => {
  expect((await request.get('/mcp')).status()).toBe(404);

  const chat = await request.post('/api/chat', {
    data: { messages: [] },
  });
  expect(chat.status()).toBe(503);

  await page.goto('/');
  await expect(page.getByRole('button', { name: '询问 AI' })).toHaveCount(0);
});

test.describe('desktop page chrome', () => {
  test.skip(({ isMobile }) => isMobile, '桌面导航测试');

  test('search, actions, and theme work', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Agent Skills 概览' })).toBeVisible();

    await page.getByRole('button', { name: '切换主题' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.keyboard.press('Control+k');
    const searchInput = page.getByRole('textbox', { name: '搜索文档' });
    await searchInput.fill('渐进式披露');
    await expect(page.getByRole('dialog')).toContainText('Agent Skills 概览');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /^打开$/ }).click();
    await expect(page.getByRole('link', { name: /查看 Markdown/ })).toHaveAttribute(
      'href',
      '/index.md',
    );
    await expect(page.getByRole('link', { name: /在 ChatGPT 中打开/ })).toHaveCount(0);
  });
});

test('MDX compatibility components remain interactive', async ({ page }) => {
  await page.goto('/skill-creation/using-scripts');
  await page.getByRole('tab', { name: 'pipx' }).click();
  await expect(page.getByRole('tabpanel', { name: 'pipx' })).toContainText('pipx run');
});

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, '仅在移动设备项目中运行');

  test('sidebar opens', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '打开侧边栏' }).click();
    await expect(page.getByRole('link', { name: '规范' }).first()).toBeVisible();
  });
});

test('unknown routes render the custom 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '找不到页面' })).toBeVisible();
});
