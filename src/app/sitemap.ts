import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteConfig } from '@/site.config';

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: new URL(page.url, siteConfig.url).toString(),
    changeFrequency: 'weekly',
    priority: page.slugs.length === 0 ? 1 : 0.8,
  }));
}
