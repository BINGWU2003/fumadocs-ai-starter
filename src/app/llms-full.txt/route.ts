import { getLLMText, source } from '@/lib/source';
import { siteConfig } from '@/site.config';

export const revalidate = false;

export async function GET() {
  if (!siteConfig.features.llms) {
    return new Response('Not Found', { status: 404 });
  }

  const pages = await Promise.all(source.getPages().map(getLLMText));

  return new Response(pages.join('\n\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
