'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2, FileText, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../lib/api';
import type { Citation, QueryResponse, Source, ViewerTarget } from '../../lib/type';

type Msg =
  | { id: number; role: 'user'; text: string }
  | {
      id: number;
      role: 'assistant';
      answer: string;
      citations: Citation[];
      followUps?: string[];
      notFound?: boolean;
      streaming?: boolean;
    };

/* split into reveal units: citation markers stay atomic, everything else reveals word-by-word */
function tokenizeForStream(text: string): string[] {
  const parts = text.split(/(\[cite:[^\]]+\])/g);
  const tokens: string[] = [];
  for (const part of parts) {
    if (/^\[cite:[^\]]+\]$/.test(part)) {
      tokens.push(part);
    } else {
      tokens.push(...(part.match(/\S+\s*|\s+/g) ?? []));
    }
  }
  return tokens;
}

export function ChatPanel({
  source,
  onCite,
  onHasMessagesChange,
}: {
  source: Source | null;
  onCite: (t: ViewerTarget) => void;
  onHasMessagesChange?: (hasMessages: boolean) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ready = source?.status === 'ready';

  useEffect(() => {
    setMessages([]);
    setInput('');
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  }, [source?.sourceId]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    onHasMessagesChange?.(messages.length > 0);
  }, [messages.length, onHasMessagesChange]);

  useEffect(() => {
    return () => onHasMessagesChange?.(false);
  }, [onHasMessagesChange]);

  const ask = async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || busy || !source || !ready) return;
    setInput('');
    setMessages((m) => [...m, { id: ++idRef.current, role: 'user', text: q }]);
    setBusy(true);
    setLoading(true);

    try {
      const res: QueryResponse = await api.query({
        question: q,
        sourceIds: [source.sourceId],
      });
      const notFound = res.citations.length === 0 && /couldn't find/i.test(res.answer);
      setLoading(false);

      const msgId = ++idRef.current;
      setMessages((m) => [
        ...m,
        { id: msgId, role: 'assistant', answer: '', citations: res.citations, notFound, streaming: true },
      ]);

      const tokens = tokenizeForStream(res.answer);
      let revealed = 0;
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      streamTimerRef.current = setInterval(() => {
        revealed++;
        const done = revealed >= tokens.length;
        const text = tokens.slice(0, revealed).join('');
        setMessages((m) =>
          m.map((msg) =>
            msg.role === 'assistant' && msg.id === msgId
              ? { ...msg, answer: text, streaming: !done, followUps: done ? res.followUps : msg.followUps }
              : msg,
          ),
        );
        if (done) {
          clearInterval(streamTimerRef.current!);
          streamTimerRef.current = null;
          setBusy(false);
        }
      }, 50);
    } catch (e) {
      setLoading(false);
      setBusy(false);
      setMessages((m) => [
        ...m,
        { id: ++idRef.current, role: 'assistant', answer: `Error: ${(e as Error).message}`, citations: [] },
      ]);
    }
  };

  const askFollowUp = (q: string) => { setInput(q); setTimeout(ask, 0); };

  const canAsk = !!source && ready && !busy;

  const statusNote = !source
    ? 'Select a source from the left panel to start chatting.'
    : !ready
      ? `“${source.title}” is still processing.`
      : null;

  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto]">
      {/* ───── messages ───── */}
      <div ref={scrollRef} className="overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-[760px] flex-col gap-5">
          {messages.length === 0 && (
            <div className="py-16 text-center text-foreground/40">
              <p className="font-heading text-[22px]">Ask a question about your sources</p>
              <p className="mt-1 text-[13px]">Answers cite the exact page or timestamp.</p>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[78%] rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed">
                  {m.text}
                </div>
              </div>
            ) : m.notFound ? (
              <div key={m.id} className="rounded-md border border-dashed border-border px-4 py-3">
                <div className="font-heading text-base">Not in your sources</div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/68">
                  {m.answer}
                  {m.streaming && <Cursor />}
                </p>
              </div>
            ) : (
              <AssistantMsg key={m.id} msg={m} onCite={onCite} onAskFollowUp={askFollowUp} />
            ),
          )}

          {loading && (
            <div className="flex items-center gap-2 text-[13px] text-foreground/50">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-accent-600)' }} />
              Reading your sources…
            </div>
          )}
        </div>
      </div>

      {/* ───── composer ───── */}
      <div className="border-t border-border bg-background px-8 py-3">
        <div className="mx-auto max-w-[760px]">
          {statusNote ? (
            <div className="mb-2 text-[12px] text-foreground/55">{statusNote}</div>
          ) : (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] text-foreground/45">Asking about</span>
              <span className="truncate text-[11px] text-foreground/68">{source!.title}</span>
              <span className="flex-1" />
              <span className="text-[11px] text-foreground/38">
                citations open in the viewer →
              </span>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              placeholder={
                !source
                  ? 'Select a source to ask a question…'
                  : !ready
                    ? 'Waiting for this source to finish processing…'
                    : 'Ask a question about this source…'
              }
              rows={2}
              disabled={!source || !ready}
              className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
            />
            <button
              onClick={() => ask()}
              disabled={!canAsk || !input.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-accent-700 disabled:opacity-60"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── assistant message with inline citations + follow-ups ───── */
function AssistantMsg({
  msg,
  onCite,
  onAskFollowUp,
}: {
  msg: Extract<Msg, { role: 'assistant' }>;
  onCite: (t: ViewerTarget) => void;
  onAskFollowUp: (q: string) => void;
}) {
  const citeMap = new Map(msg.citations.map((c) => [c.chunkId, c]));
  const markdown = msg.answer + (msg.streaming ? ' ▍' : '');

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-accent-700)' }}>
          Answer
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] tabular-nums text-foreground/40">{msg.citations.length} sources cited</span>
      </div>

      <div className="chat-md text-[14px] leading-[1.68] text-foreground">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-3 text-justify leading-[1.68]">{withCitations(children, citeMap, onCite)}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 list-disc space-y-1.5 pl-5 marker:text-foreground/40">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 list-decimal space-y-1.5 pl-5 marker:text-foreground/40">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="pl-0.5 leading-[1.6]">{withCitations(children, citeMap, onCite)}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-medium" style={{ color: 'var(--color-accent-800)' }}>
                {withCitations(children, citeMap, onCite)}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-foreground/80">{withCitations(children, citeMap, onCite)}</em>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>

      {msg.followUps && msg.followUps.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[12px] text-foreground/50">Follow up</span>
          {msg.followUps.map((f, i) => (
            <button
              key={i}
              onClick={() => onAskFollowUp(f)}
              className="rounded border border-border px-2.5 py-1 text-[12px] hover:bg-card"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Cursor() {
  return <span className="ml-0.5 inline-block w-0.5 translate-y-0.5 animate-pulse bg-current align-middle">▍</span>;
}

/* replace [cite:ID] markers inside markdown text children with citation chips */
function withCitations(
  children: ReactNode,
  citeMap: Map<string, Citation>,
  onCite: (t: ViewerTarget) => void,
): ReactNode {
  const arr = Array.isArray(children) ? children : [children];
  return arr.flatMap((child, idx) => {
    if (typeof child !== 'string') return child;
    const parts = child.split(/(\[cite:[^\]]+\])/g);
    return parts.map((part, i) => {
      const m = part.match(/^\[cite:(.+)\]$/);
      if (!m) return part ? <span key={`${idx}-${i}`}>{part}</span> : null;
      const c = citeMap.get(m[1]);
      return c ? <InlineCite key={`${idx}-${i}`} c={c} onCite={onCite} /> : null;
    });
  });
}

function InlineCite({ c, onCite }: { c: Citation; onCite: (t: ViewerTarget) => void }) {
  console.log('[InlineCite] c:', c);
  const isVideo = !!c.videoId;

  const click = () =>
    isVideo
      ? onCite({ kind: 'video', videoId: c.videoId!, startSeconds: c.startSeconds! })
      : onCite({ kind: 'pdf', sourceId: c.sourceId, page: c.page ?? 1, snippet: c.snippet });

  return (
    <button
      onClick={click}
      className="mx-0.5 inline-flex items-center cursor-pointer gap-0.5 rounded-full border px-1.5 py-px align-baseline text-[11px] tabular-nums hover:bg-accent-100"
      style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent-700)' }}
      title={c.title}
    >
      {isVideo ? <Play size={9} /> : <FileText size={9} />}
      {isVideo ? fmt(c.startSeconds!) : `p.${c.page}`}
    </button>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
