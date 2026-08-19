import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineDocs } from 'fumadocs-mdx/macro';

const docs = defineDocs({
  dir: 'docs',
  docs: {
    files: ['**/*.mdx'],
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']): string {
  if (page.slugs.length === 0) return '/index.md';
  return `${page.url}.md`;
}

export function getPageImageUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/${['og', ...segments].join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']): Promise<string> {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
