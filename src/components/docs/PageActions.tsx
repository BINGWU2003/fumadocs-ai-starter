'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Check,
  ChevronDown,
  Code2,
  ExternalLink,
  FileText,
  MonitorDown,
  Plug,
  Search,
  Sparkles,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { siteConfig, type ContextualActionId } from '@/site.config';

interface ActionContext {
  markdownUrl: string;
  mcpName: string;
  mcpUrl: string;
  pageUrl: string;
}

interface ActionDefinition {
  title: string;
  description: string;
  icon: LucideIcon;
  kind: 'link' | 'copy';
  getValue: (context: ActionContext) => string;
}

function questionPrompt(pageUrl: string) {
  return `请阅读 ${pageUrl}，我想就其中的内容提问。`;
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const actionRegistry: Record<ContextualActionId, ActionDefinition> = {
  view: {
    title: '查看 Markdown',
    description: '以纯 Markdown 格式打开此页面',
    icon: FileText,
    kind: 'link',
    getValue: ({ markdownUrl }) => markdownUrl,
  },
  chatgpt: {
    title: '在 ChatGPT 中打开',
    description: '就此页面提问',
    icon: Bot,
    kind: 'link',
    getValue: ({ pageUrl }) =>
      `https://chat.openai.com/?${new URLSearchParams({
        hints: 'search',
        q: questionPrompt(pageUrl),
      })}`,
  },
  claude: {
    title: '在 Claude 中打开',
    description: '就此页面提问',
    icon: Sparkles,
    kind: 'link',
    getValue: ({ pageUrl }) =>
      `https://claude.ai/new?${new URLSearchParams({ q: questionPrompt(pageUrl) })}`,
  },
  perplexity: {
    title: '在 Perplexity 中打开',
    description: '就此页面提问',
    icon: Search,
    kind: 'link',
    getValue: ({ pageUrl }) =>
      `https://www.perplexity.ai/search?${new URLSearchParams({
        q: questionPrompt(pageUrl),
      })}`,
  },
  mcp: {
    title: '复制 MCP 服务器',
    description: '复制文档 MCP 服务器 URL',
    icon: Plug,
    kind: 'copy',
    getValue: ({ mcpUrl }) => mcpUrl,
  },
  cursor: {
    title: '连接到 Cursor',
    description: '在 Cursor 中安装文档 MCP 服务器',
    icon: Code2,
    kind: 'link',
    getValue: ({ mcpName, mcpUrl }) => {
      const config = encodeBase64(JSON.stringify({ name: mcpName, url: mcpUrl }));
      return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(mcpName)}&config=${encodeURIComponent(config)}`;
    },
  },
  vscode: {
    title: '连接到 VS Code',
    description: '在 VS Code 中安装文档 MCP 服务器',
    icon: MonitorDown,
    kind: 'link',
    getValue: ({ mcpName, mcpUrl }) =>
      `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: mcpName, url: mcpUrl }))}`,
  },
};

export function PageActions({ markdownUrl }: { markdownUrl: string }) {
  const pathname = usePathname();
  const [copiedAction, setCopiedAction] = useState<ContextualActionId>();
  const actions = siteConfig.contextualActions.filter((id) => {
    if (id === 'mcp' || id === 'cursor' || id === 'vscode') {
      return siteConfig.features.mcp;
    }
    return true;
  });
  const context = useMemo<ActionContext>(() => {
    return {
      markdownUrl,
      mcpName: siteConfig.name,
      mcpUrl: new URL(siteConfig.mcpEndpoint, siteConfig.url).toString(),
      pageUrl: new URL(pathname, siteConfig.url).toString(),
    };
  }, [markdownUrl, pathname]);

  if (actions.length === 0) return null;

  async function copyAction(id: ContextualActionId, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedAction(id);
    window.setTimeout(() => setCopiedAction(undefined), 2_000);
  }

  return (
    <Popover>
      <PopoverTrigger className={`${buttonVariants({ color: 'secondary', size: 'sm' })} gap-2`}>
        打开
        <ChevronDown className="size-3.5 text-fd-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="flex w-72 flex-col p-1" align="start">
        {actions.map((id) => {
          const action = actionRegistry[id];
          const value = action.getValue(context);
          const Icon = copiedAction === id ? Check : action.icon;
          const content = (
            <>
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-medium">{action.title}</span>
                <span className="block text-xs text-fd-muted-foreground">
                  {copiedAction === id ? '已复制到剪贴板' : action.description}
                </span>
              </span>
              {action.kind === 'link' && (
                <ExternalLink
                  className="ms-auto mt-0.5 size-3.5 shrink-0 text-fd-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </>
          );
          const className =
            'flex items-start gap-2 rounded-lg p-2 text-left text-sm hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

          if (action.kind === 'copy') {
            return (
              <button
                key={id}
                type="button"
                className={className}
                onClick={() => void copyAction(id, value)}
              >
                {content}
              </button>
            );
          }

          return (
            <a
              key={id}
              href={value}
              target="_blank"
              rel="noreferrer noopener"
              className={className}
            >
              {content}
            </a>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
