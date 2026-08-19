import { createAgentUIStreamResponse } from 'ai';
import { siteConfig } from '@/site.config';

const maxMessages = 20;
const maxPayloadCharacters = 50_000;
const requestTimeoutMs = 60_000;

export async function POST(request: Request) {
  if (!siteConfig.features.ai) {
    return Response.json({ error: 'AI 服务未启用。' }, { status: 404 });
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: 'AI 服务尚未配置 GOOGLE_GENERATIVE_AI_API_KEY。' },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > maxPayloadCharacters) {
    return Response.json({ error: '请求内容过大。' }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: '请求内容必须是有效的 JSON。' }, { status: 400 });
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('messages' in payload) ||
    !Array.isArray(payload.messages)
  ) {
    return Response.json({ error: '请求中缺少 messages 数组。' }, { status: 400 });
  }

  if (
    payload.messages.length > maxMessages ||
    JSON.stringify(payload.messages).length > maxPayloadCharacters
  ) {
    return Response.json({ error: '对话内容超出限制。' }, { status: 413 });
  }

  const { createDocsAgent } = await import('@/lib/ai/docs-agent');
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(requestTimeoutMs)]);

  return createAgentUIStreamResponse({
    agent: createDocsAgent(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    uiMessages: payload.messages,
    abortSignal: signal,
  });
}
