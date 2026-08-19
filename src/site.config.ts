export type ContextualActionId =
  | 'view'
  | 'chatgpt'
  | 'claude'
  | 'perplexity'
  | 'mcp'
  | 'cursor'
  | 'vscode';

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  locale: string;
  repository: {
    url?: string;
  };
  announcement?: {
    id: string;
    text: string;
    linkText: string;
    href: string;
  };
  features: {
    ai: boolean;
    mcp: boolean;
    llms: boolean;
  };
  ai: {
    assistantName: string;
  };
  mcpEndpoint: string;
  contextualActions: ContextualActionId[];
}

export const siteConfig: SiteConfig = {
  name: 'Fumadocs AI Starter',
  description: '一个内置搜索、机器可读输出和可选 AI 助手的 Fumadocs 文档模板。',
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000',
  locale: 'zh-CN',
  repository: {
    url: 'https://github.com/BINGWU2003/fumadocs-ai-starter',
  },
  features: {
    ai: true,
    mcp: false,
    llms: true,
  },
  ai: {
    assistantName: '文档助手',
  },
  mcpEndpoint: '/mcp',
  contextualActions: ['view'],
};
