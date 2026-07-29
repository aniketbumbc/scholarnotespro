'use client';
import { useState } from 'react';
import { Loader2, FileText, Play } from 'lucide-react';
import { api } from '../../lib/api';
import type { Citation, QueryResponse, Source, ViewerTarget } from '../../lib/type';

type Msg =
  | { role: 'user'; text: string }
  | { role: 'assistant'; answer: string; citations: Citation[]; followUps?: string[]; notFound?: boolean };

export function ChatPanel({
  sources,
  onCite,
}: {
  sources: Source[];
  onCite: (t: ViewerTarget) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [scope, setScope] = useState('all');
  const [busy, setBusy] = useState(false);

  const readySources = sources.filter((s) => s.status === 'ready');

  const ask = async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);

    try {
      const body: any = { question: q };
      if (scope !== 'all') {
        if (scope.startsWith('pl:')) body.playlistId = scope.slice(3);
        else body.sourceIds = [scope];
      }
      const res: QueryResponse = await api.query(body);
      const notFound = res.citations.length === 0 && /couldn't find/i.test(res.answer);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          answer: res.answer,
          citations: res.citations,
          followUps: res.followUps,
          notFound,
        },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', answer: `Error: ${(e as Error).message}`, citations: [] }]);
    } finally {
      setBusy(false);
    }
  };

  const askFollowUp = (q: string) => { setInput(q); setTimeout(ask, 0); };


  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto]">
      {/* ───── messages ───── */}
      <div className="overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-[760px] flex-col gap-5">
          {messages.length === 0 && (
            <div className="py-16 text-center text-foreground/40">
              <p className="font-heading text-[22px]">Ask a question about your sources</p>
              <p className="mt-1 text-[13px]">Answers cite the exact page or timestamp.</p>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[78%] rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed">
                  {m.text}
                </div>
              </div>
            ) : m.notFound ? (
              <div key={i} className="rounded-md border border-dashed border-border px-4 py-3">
                <div className="font-heading text-base">Not in your sources</div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/68">{m.answer}</p>
              </div>
            ) : (
              <AssistantMsg key={i} msg={m} onCite={onCite} onAskFollowUp={askFollowUp} />
            ),
          )}

          {busy && (
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
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] text-foreground/45">Ask across</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="all">All ready sources</option>
              {readySources
                .filter((s) => !s.playlistId)
                .map((s) => (
                  <option key={s.sourceId} value={s.sourceId}>
                    {s.title}
                  </option>
                ))}
              {[...new Set(readySources.filter((s) => s.playlistId).map((s) => s.playlistId))].map((pid) => (
                <option key={pid} value={`pl:${pid}`}>
                  Series
                </option>
              ))}
            </select>
            <span className="flex-1" />
            <span className="text-[11px] text-foreground/38">
              {readySources.length} of {sources.length} queryable · citations open in the viewer →
            </span>
          </div>
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
              placeholder="Ask a question about your sources…"
              rows={2}
              className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => ask()}
              disabled={busy}
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

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-accent-700)' }}>
          Answer
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] tabular-nums text-foreground/40">{msg.citations.length} sources cited</span>
      </div>

      {msg.answer
        .split('\n\n')
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="mb-3 text-justify text-[14px] leading-[1.68]">
            {renderInline(para, citeMap, onCite)}
          </p>
        ))}

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

/* split text on [cite:ID] markers → interleave citation chips */
function renderInline(text: string, citeMap: Map<string, Citation>, onCite: (t: ViewerTarget) => void) {
  const parts = text.split(/(\[cite:[^\]]+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[cite:(.+)\]$/);
    if (!m) return <span key={i}>{part}</span>;
    const c = citeMap.get(m[1]);
    if (!c) return null;
    return <InlineCite key={i} c={c} onCite={onCite} />;
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