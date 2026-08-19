import { cn } from 'cnfast';
import { MessageCircleIcon } from 'lucide-react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/AISearch';
import { baseOptions } from '@/lib/layout';
import { source } from '@/lib/source';
import { siteConfig } from '@/site.config';

export default function DocsRootLayout({ children }: { children: React.ReactNode }) {
  const aiEnabled = siteConfig.features.ai && Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
      {aiEnabled && (
        <AISearch>
          <AISearchPanel />
          <AISearchTrigger
            position="float"
            className={cn(
              buttonVariants({
                variant: 'secondary',
                className: 'rounded-2xl text-fd-muted-foreground',
              }),
            )}
          >
            <MessageCircleIcon className="size-4.5" />
            询问 AI
          </AISearchTrigger>
        </AISearch>
      )}
      {children}
    </DocsLayout>
  );
}
