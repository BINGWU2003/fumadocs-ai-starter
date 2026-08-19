# Fumadocs AI Starter

一个可直接部署的文档网站模板，基于 Next.js 16、Fumadocs、TypeScript 和 Tailwind CSS。模板内置全文搜索、Markdown 页面、LLM 文本输出、SEO/OG，并提供默认关闭的 AI 问答和 MCP 服务。

当前仓库使用 Agent Skills 中文文档演示真实内容规模、导航层级和 MDX 组件。示例内容不是本站原创，也不代表 Agent Skills 官方网站。

## 创建项目

在 GitHub 将本仓库设置为 Template Repository 后，点击 “Use this template”。也可以直接克隆：

```powershell
git clone <your-repository-url>
cd fumadocs-ai-starter
corepack enable
pnpm install
pnpm dev
```

打开 http://localhost:3000。

## 第一次定制

1. 修改 `src/site.config.ts` 中的名称、描述、正式域名和仓库地址。
2. 替换 `src/app/icon.svg`。
3. 编辑 `docs/` 中的 MDX 页面，并通过各级 `meta.json` 调整导航。
4. 按需修改首页、主题色和 `tests/e2e/site.spec.ts` 中的内容断言。

正式部署时，在平台环境变量中设置 `NEXT_PUBLIC_SITE_URL`，值必须是带协议的绝对地址。

## 功能

- Fumadocs 文档导航与搜索
- 每页 Markdown 输出
- `/llms.txt` 与 `/llms-full.txt`
- sitemap、robots 和动态 OG 图片
- 桌面与移动端 Playwright 测试
- 可选 Gemini AI 文档助手
- 可选只读 MCP 文档服务

## AI 文档助手

AI 默认不需要配置即可构建。只有 `siteConfig.features.ai` 为 `true` 且服务端存在 API Key 时，界面才会显示入口。

```powershell
Copy-Item .env.example .env.local
```

然后在 `.env.local` 中填写 Google AI Studio 提供的 `GOOGLE_GENERATIVE_AI_API_KEY`，必要时覆盖 `GEMINI_MODEL`。不要提交真实密钥。公开部署前还应配置限流、访问控制和费用告警。

## MCP

MCP 默认关闭。确认部署环境和访问策略后，在 `src/site.config.ts` 中将 `features.mcp` 改为 `true`，再按需把 `mcp`、`cursor` 或 `vscode` 加入 `contextualActions`。

## 验证

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

## 部署

### Vercel

将仓库导入 Vercel，平台会读取 `vercel.json` 并使用 Next.js 原生构建。至少配置 `NEXT_PUBLIC_SITE_URL`；启用 AI 时再配置 `GOOGLE_GENERATIVE_AI_API_KEY` 和可选的 `GEMINI_MODEL`。

### Netlify

将仓库导入 Netlify，平台会读取 `netlify.toml`，并通过 Netlify Next.js Runtime 部署 Route Handlers。环境变量要求与 Vercel 相同。

由于搜索、AI、MCP 和动态输出使用 Route Handlers，本模板不是纯静态导出项目。

## 许可证

继承及新增代码按 Apache License 2.0 提供。保留的 Agent Skills 示例文档按 CC BY 4.0 提供，详情见 `docs/LICENSE` 和 `ATTRIBUTION.md`。完全替换示例文档后，你可以为自己的原创内容选择许可方式。

---

## English

Fumadocs AI Starter is a GitHub-ready documentation template built with Next.js 16 and Fumadocs. It includes search, Markdown and LLM-friendly outputs, SEO/OG, tests, and opt-in AI and MCP endpoints. Replace the sample content and `src/site.config.ts` before publishing.
