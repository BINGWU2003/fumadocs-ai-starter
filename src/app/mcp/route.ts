import { getLLMText, source } from '@/lib/source';
import { siteConfig } from '@/site.config';

const protocolVersion = '2025-06-18';

const tools = [
  {
    name: 'search_docs',
    description: `搜索 ${siteConfig.name} 文档中的相关页面和摘录。`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '要搜索的词语或短语。',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_doc',
    description: '读取文档页面的完整 Markdown。',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文档 URL 路径，例如 /specification。',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
] as const;

interface JsonRpcRequest {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

function jsonRpcResult(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return Response.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message },
  });
}

function getArguments(params: unknown): Record<string, unknown> {
  if (!params || typeof params !== 'object') return {};
  const args = (params as { arguments?: unknown }).arguments;
  return args && typeof args === 'object' ? (args as Record<string, unknown>) : {};
}

function normalizeDocPath(value: string) {
  let pathname = value;

  try {
    pathname = new URL(value, siteConfig.url).pathname;
  } catch {
    // 保留传入路径，由下方的规范化逻辑进行验证。
  }

  return pathname
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.(?:md|mdx)$/i, '')
    .split('/')
    .filter(Boolean);
}

async function searchDocs(query: string) {
  const normalized = query.trim().toLocaleLowerCase('zh-CN');
  if (!normalized) return [];

  const pages = await Promise.all(
    source.getPages().map(async (page) => {
      const text = await page.data.getText('processed');
      const haystack = `${page.data.title}\n${page.data.description ?? ''}\n${text}`;
      const matchIndex = haystack.toLocaleLowerCase('zh-CN').indexOf(normalized);
      if (matchIndex < 0) return null;

      const excerptStart = Math.max(0, matchIndex - 120);
      const excerptEnd = Math.min(haystack.length, matchIndex + normalized.length + 240);

      return {
        title: page.data.title,
        description: page.data.description,
        url: new URL(page.url, siteConfig.url).toString(),
        excerpt: haystack.slice(excerptStart, excerptEnd).replace(/\s+/g, ' ').trim(),
      };
    }),
  );

  return pages.filter((page) => page !== null).slice(0, 10);
}

async function callTool(name: unknown, args: Record<string, unknown>) {
  if (name === 'search_docs') {
    const query = typeof args.query === 'string' ? args.query.slice(0, 500) : '';
    if (!query.trim()) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'query 参数必须是非空字符串。' }],
      };
    }

    const matches = await searchDocs(query);
    return {
      content: [
        {
          type: 'text',
          text:
            matches.length > 0
              ? JSON.stringify(matches, null, 2)
              : `没有文档页面与“${query}”匹配。`,
        },
      ],
    };
  }

  if (name === 'get_doc') {
    const path = typeof args.path === 'string' ? args.path : '';
    const page = source.getPage(normalizeDocPath(path));

    if (!page) {
      return {
        isError: true,
        content: [{ type: 'text', text: `“${path}”对应的文档页面不存在。` }],
      };
    }

    return {
      content: [{ type: 'text', text: await getLLMText(page) }],
    };
  }

  return {
    isError: true,
    content: [{ type: 'text', text: `未知工具：${String(name)}` }],
  };
}

export function GET() {
  if (!siteConfig.features.mcp) {
    return new Response('Not Found', { status: 404 });
  }

  return Response.json({
    server: {
      name: siteConfig.name,
      version: '1.0.0',
      transport: 'streamable-http',
    },
    instructions: `此只读 MCP 服务器提供 ${siteConfig.name} 文档的搜索和读取工具。`,
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false },
    },
    tools,
  });
}

export async function POST(request: Request) {
  if (!siteConfig.features.mcp) {
    return new Response('Not Found', { status: 404 });
  }

  let body: JsonRpcRequest;

  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, -32700, '解析错误');
  }

  if (body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return jsonRpcError(body.id, -32600, '无效请求');
  }

  if (body.method.startsWith('notifications/')) {
    return new Response(null, { status: 202 });
  }

  switch (body.method) {
    case 'initialize': {
      const requested =
        body.params && typeof body.params === 'object'
          ? (body.params as { protocolVersion?: unknown }).protocolVersion
          : undefined;

      return jsonRpcResult(body.id, {
        protocolVersion: typeof requested === 'string' ? requested : protocolVersion,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
        },
        serverInfo: { name: siteConfig.name, version: '1.0.0' },
        instructions: `搜索并读取公开的 ${siteConfig.name} 文档。`,
      });
    }
    case 'ping':
      return jsonRpcResult(body.id, {});
    case 'tools/list':
      return jsonRpcResult(body.id, { tools });
    case 'tools/call': {
      const params =
        body.params && typeof body.params === 'object'
          ? (body.params as { name?: unknown })
          : {};
      return jsonRpcResult(body.id, await callTool(params.name, getArguments(body.params)));
    }
    case 'resources/list':
      return jsonRpcResult(body.id, {
        resources: source.getPages().map((page) => ({
          uri: `docs://${page.slugs.length === 0 ? 'index' : page.slugs.join('/')}`,
          name: page.data.title,
          description: page.data.description,
          mimeType: 'text/markdown',
        })),
      });
    case 'resources/read': {
      const uri =
        body.params && typeof body.params === 'object'
          ? (body.params as { uri?: unknown }).uri
          : undefined;
      const path = typeof uri === 'string' ? uri.replace(/^docs:\/\//, '') : '';
      const page = source.getPage(path === 'index' ? [] : normalizeDocPath(path));
      if (!page) return jsonRpcError(body.id, -32602, '未知文档资源');

      return jsonRpcResult(body.id, {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: await getLLMText(page),
          },
        ],
      });
    }
    default:
      return jsonRpcError(body.id, -32601, '找不到方法');
  }
}

export function DELETE() {
  if (!siteConfig.features.mcp) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(null, { status: 204 });
}
