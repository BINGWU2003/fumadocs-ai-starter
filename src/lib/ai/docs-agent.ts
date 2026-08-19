import 'server-only';

import { createGoogle } from '@ai-sdk/google';
import { Document, type DocumentData } from 'flexsearch';
import { InferAgentUIMessage, isStepCount, tool, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { source } from '@/lib/source';
import { siteConfig } from '@/site.config';

interface SearchDocument extends DocumentData {
  url: string;
  title: string;
  description: string;
  content: string;
}

async function createSearchIndex() {
  const search = new Document<SearchDocument>({
    document: {
      id: 'url',
      index: ['title', 'description', 'content'],
      store: true,
    },
  });

  const documents = await Promise.all(
    source.getPages().map(async (page): Promise<SearchDocument | null> => {
      if (!('getText' in page.data)) return null;

      return {
        url: page.url,
        title: page.data.title,
        description: page.data.description ?? '',
        content: await page.data.getText('processed'),
      };
    }),
  );

  for (const document of documents) {
    if (document) search.add(document);
  }

  return search;
}

const searchIndex = createSearchIndex();

const searchDocs = tool({
  description: `搜索 ${siteConfig.name} 文档，并返回包含页面 URL 的原始搜索结果。`,
  inputSchema: z.object({
    query: z.string().min(1).describe('要在文档中查找的关键词或问题'),
    limit: z.number().int().min(1).max(20).default(8),
  }),
  async execute({ query, limit }) {
    const search = await searchIndex;
    return search.searchAsync(query, {
      limit,
      merge: true,
      enrich: true,
    });
  },
});

export function createDocsAgent(apiKey: string) {
  const google = createGoogle({ apiKey });

  return new ToolLoopAgent({
    model: google(process.env.GEMINI_MODEL ?? 'gemini-3.7-flash'),
    instructions: [
      `你是 ${siteConfig.name} 的 AI 文档助手。`,
      '回答问题前，先使用 searchDocs 工具检索文档。',
      '仅根据检索到的文档内容回答，不要编造要求或实现行为。',
      '使用简体中文回答，并在适用时用 Markdown 链接引用搜索结果中的 url。',
      '如果文档中没有答案，请明确说明不知道，并建议更合适的检索关键词。',
    ].join('\n'),
    stopWhen: isStepCount(5),
    tools: {
      searchDocs,
    },
  });
}

export type DocsAgentUIMessage = InferAgentUIMessage<ReturnType<typeof createDocsAgent>>;
