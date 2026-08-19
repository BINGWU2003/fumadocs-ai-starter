'use client';

import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { cn } from 'cnfast';
import { Loader2, MessageCircleIcon, RefreshCw, SearchIcon, Send, X } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type SyntheticEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import type { DocsAgentUIMessage } from '@/lib/ai/docs-agent';
import { siteConfig } from '@/site.config';
import { Markdown } from './Markdown';

type SearchInvocation = Extract<DocsAgentUIMessage['parts'][number], { type: 'tool-searchDocs' }>;

interface AISearchContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: UseChatHelpers<DocsAgentUIMessage>;
}

const AISearchContext = createContext<AISearchContextValue | null>(null);

function useAISearchContext() {
  const value = useContext(AISearchContext);
  if (!value) throw new Error('AI 搜索组件必须放在 <AISearch> 内。');
  return value;
}

function useChatContext() {
  return useAISearchContext().chat;
}

export function AISearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const chat = useChat<DocsAgentUIMessage>({
    id: 'docs-search',
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const value = useMemo(() => ({ chat, open, setOpen }), [chat, open]);

  return <AISearchContext value={value}>{children}</AISearchContext>;
}

export function AISearchTrigger({
  position = 'default',
  className,
  ...props
}: ComponentProps<'button'> & { position?: 'default' | 'float' }) {
  const { open, setOpen } = useAISearchContext();

  return (
    <button
      type="button"
      aria-controls="nd-ai-panel"
      aria-expanded={open}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        position === 'float' && [
          'fixed inset-e-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0px))] bottom-4 z-20 gap-2 px-4 shadow-lg transition-[translate,opacity]',
          open && 'translate-y-10 opacity-0',
        ],
        className,
      )}
      {...props}
      onClick={() => setOpen(!open)}
    >
      {props.children}
    </button>
  );
}

function AISearchPanelHeader() {
  const { setOpen } = useAISearchContext();

  return (
    <div className="sticky top-0 flex items-start gap-2 rounded-xl border bg-fd-secondary text-fd-secondary-foreground shadow-sm">
      <div className="flex-1 px-3 py-2">
        <p className="mb-2 text-sm font-medium">AI 文档助手</p>
        <p className="text-xs text-fd-muted-foreground">
          AI 可能会出错，请根据引用的文档核实答案。
        </p>
      </div>
      <button
        type="button"
        aria-label="关闭 AI 助手"
        className={buttonVariants({
          size: 'icon-sm',
          color: 'ghost',
          className: 'rounded-full text-fd-muted-foreground',
        })}
        onClick={() => setOpen(false)}
      >
        <X />
      </button>
    </div>
  );
}

function AISearchInputActions() {
  const { messages, status, setMessages, regenerate } = useChatContext();
  const isLoading = status === 'streaming' || status === 'submitted';

  if (messages.length === 0) return null;

  return (
    <>
      {!isLoading && messages.at(-1)?.role === 'assistant' && (
        <button
          type="button"
          className={buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'gap-1.5 rounded-full',
          })}
          onClick={() => void regenerate()}
        >
          <RefreshCw className="size-4" />
          重新回答
        </button>
      )}
      <button
        type="button"
        className={buttonVariants({
          color: 'secondary',
          size: 'sm',
          className: 'rounded-full',
        })}
        onClick={() => setMessages([])}
      >
        清空对话
      </button>
    </>
  );
}

function Input(props: ComponentProps<'textarea'>) {
  const shared = cn('col-start-1 row-start-1', props.className);

  return (
    <div className="grid flex-1">
      <textarea
        id="nd-ai-input"
        rows={1}
        {...props}
        className={cn(
          'resize-none bg-transparent placeholder:text-fd-muted-foreground focus-visible:outline-none',
          shared,
        )}
      />
      <div aria-hidden="true" className={cn(shared, 'invisible break-all whitespace-pre-wrap')}>
        {`${props.value?.toString() ?? ''}\n`}
      </div>
    </div>
  );
}

function AISearchInput(props: ComponentProps<'form'>) {
  const { status, sendMessage, stop } = useChatContext();
  const [input, setInput] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';

  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault();
    const message = input.trim();
    if (message.length === 0 || isLoading) return;

    void sendMessage({ text: message });
    setInput('');
  };

  return (
    <form {...props} className={cn('flex items-start pe-2', props.className)} onSubmit={submit}>
      <Input
        aria-label="向 AI 询问文档"
        value={input}
        placeholder={isLoading ? 'AI 正在回答…' : '询问文档问题'}
        autoFocus
        className="p-3"
        disabled={isLoading}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === 'Enter' && !event.nativeEvent.isComposing) {
            submit(event);
          }
        }}
      />
      {isLoading ? (
        <button
          type="button"
          className={buttonVariants({
            color: 'secondary',
            className: 'mt-2 gap-2 rounded-full transition-all',
          })}
          onClick={() => void stop()}
        >
          <Loader2 className="size-4 animate-spin text-fd-muted-foreground" />
          停止回答
        </button>
      ) : (
        <button
          type="submit"
          aria-label="发送问题"
          className={buttonVariants({
            color: 'primary',
            className: 'mt-2 rounded-full transition-all',
          })}
          disabled={input.trim().length === 0}
        >
          <Send className="size-4" />
        </button>
      )}
    </form>
  );
}

function Message({ message }: { message: DocsAgentUIMessage }) {
  let markdown = '';
  const searchCalls: SearchInvocation[] = [];

  for (const part of message.parts) {
    if (part.type === 'text') markdown += part.text;
    if (part.type === 'tool-searchDocs') searchCalls.push(part);
  }

  return (
    <div>
      <p
        className={cn(
          'mb-1 text-sm font-medium text-fd-muted-foreground',
          message.role === 'assistant' && 'text-fd-primary',
        )}
      >
        {message.role === 'assistant' ? siteConfig.ai.assistantName : '你'}
      </p>
      {markdown && (
        <div className="prose text-sm">
          <Markdown text={markdown} />
        </div>
      )}

      {searchCalls.map((call) => (
        <div
          key={call.toolCallId}
          className="mt-3 flex items-center gap-2 rounded-lg border bg-fd-secondary p-2 text-xs text-fd-muted-foreground"
        >
          <SearchIcon className="size-4" />
          {call.state === 'output-error' ? (
            <p className="text-fd-error">{call.errorText || '搜索失败'}</p>
          ) : call.state === 'output-denied' ? (
            <p className="text-fd-error">搜索未获允许</p>
          ) : call.state === 'output-available' ? (
            <p>找到 {call.output.length} 条搜索结果</p>
          ) : (
            <p>正在搜索文档…</p>
          )}
        </div>
      ))}
    </div>
  );
}

function MessageList(props: ComponentProps<'div'>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollToBottom = () => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'instant' });
    };
    const observer = new ResizeObserver(scrollToBottom);
    const content = container.firstElementChild;
    if (content) observer.observe(content);
    scrollToBottom();

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn('fd-scroll-container flex min-w-0 flex-col overflow-y-auto', props.className)}
    />
  );
}

function AISearchPanelList() {
  const chat = useChatContext();
  const messages = chat.messages.filter((message) => message.role !== 'system');

  return (
    <MessageList
      className="flex-1 overscroll-contain py-4"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)',
      }}
    >
      {messages.length === 0 ? (
        <div className="flex size-full flex-col items-center justify-center gap-2 text-center text-sm text-fd-muted-foreground/80">
          <MessageCircleIcon fill="currentColor" stroke="none" />
          <p>在下方输入问题，开始查询文档。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-3">
          {chat.error && (
            <div className="rounded-lg border bg-fd-secondary p-2 text-fd-secondary-foreground">
              <p className="mb-1 text-xs text-fd-muted-foreground">请求失败</p>
              <p className="text-sm">{chat.error.message}</p>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </div>
      )}
    </MessageList>
  );
}

function useHotKey() {
  const { open, setOpen } = useAISearchContext();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        event.preventDefault();
      }

      if (event.key === '/' && (event.metaKey || event.ctrlKey) && !open) {
        setOpen(true);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);
}

export function AISearchPanel() {
  const { open, setOpen } = useAISearchContext();
  useHotKey();

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes ask-ai-open {
          from { translate: 100% 0; }
          to { translate: 0 0; }
        }
      `}</style>
      <button
        type="button"
        aria-label="关闭 AI 助手"
        className="fixed inset-0 z-40 animate-fd-fade-in bg-fd-overlay backdrop-blur-xs lg:hidden"
        onClick={() => setOpen(false)}
      />
      <aside
        id="nd-ai-panel"
        aria-label="AI 文档助手"
        className={cn(
          'z-50 overflow-hidden bg-fd-card text-fd-card-foreground [--ai-chat-width:400px] 2xl:[--ai-chat-width:460px]',
          'fixed inset-x-2 inset-y-4 rounded-2xl border shadow-xl lg:sticky lg:inset-auto lg:top-0 lg:ms-auto lg:h-dvh lg:rounded-none lg:border-y-0 lg:border-s lg:border-e-0 lg:shadow-none',
          'lg:in-[#nd-docs-layout]:[grid-area:toc] lg:in-[#nd-notebook-layout]:col-start-5 lg:in-[#nd-notebook-layout]:row-span-full',
          'animate-fd-dialog-in lg:animate-[ask-ai-open_200ms]',
        )}
      >
        <div className="flex size-full flex-col p-2 lg:w-(--ai-chat-width) lg:p-3">
          <AISearchPanelHeader />
          <AISearchPanelList />
          <div className="rounded-xl border bg-fd-secondary text-fd-secondary-foreground shadow-sm has-focus-visible:shadow-md">
            <AISearchInput />
            <div className="flex items-center gap-1.5 p-1 empty:hidden">
              <AISearchInputActions />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
