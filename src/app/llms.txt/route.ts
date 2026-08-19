import { llms } from 'fumadocs-core/source';
import { source } from '@/lib/source';
import { siteConfig } from '@/site.config';

export const revalidate = false;

export function GET() {
  if (!siteConfig.features.llms) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(llms(source).index(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
