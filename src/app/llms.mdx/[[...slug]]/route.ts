import { notFound } from 'next/navigation';
import { getLLMText, source } from '@/lib/source';
import { siteConfig } from '@/site.config';

export const revalidate = false;

export async function GET(_request: Request, { params }: RouteContext<'/llms.mdx/[[...slug]]'>) {
  if (!siteConfig.features.llms) {
    return new Response('Not Found', { status: 404 });
  }

  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
