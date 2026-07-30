'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import type { Source } from '../../lib/type';

/** Fix common LLM markdown that collapses lists/headings onto one line. */
function normalizeSummaryMarkdown(md: string): string {
  return md
    .replace(/\r\n/g, '\n')
    // Put headings on their own line
    .replace(/([^\n])\s*(#{1,4}\s+)/g, '$1\n\n$2')
    // Put bullet items on their own line (e.g. "...text. - **Term**:")
    .replace(/([^\n])\s+-\s+(\*\*[^*]+\*\*)/g, '$1\n- $2')
    .replace(/([^\n])\s+-\s+(?=[A-Z0-9])/g, '$1\n- ')
    .trim();
}

export function SummaryTab({ source }: { source: Source | null }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const generate = async (sourceId: string) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await api.query({
        question: 'give me a summary of the document',
        sourceIds: [sourceId],
      });
      setSummary(normalizeSummaryMarkdown(res.answer));
      setLoadedId(sourceId);
    } catch (e) {
      setError((e as Error).message ?? 'Could not generate summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (source?.status === 'ready' && source.sourceId !== loadedId) {
      generate(source.sourceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate only when source identity/status changes
  }, [source?.sourceId, source?.status]);

  if (!source) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-foreground/40">
        <p>Select a source from the left panel, then this tab summarizes it.</p>
      </div>
    );
  }

  if (source.status !== 'ready') {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-foreground/40">
        <p>“{source.title}” is still processing.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-8 py-4">
        <div className="mx-auto flex max-w-[760px] items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-[27px]">Summary</h2>
            <p className="mt-0.5 truncate text-[12px] text-foreground/45">{source.title}</p>
          </div>
          <button
            onClick={() => generate(source.sourceId)}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1 text-[12px] hover:bg-card disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Regenerate
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[760px]">
          {loading ? (
            <div className="flex flex-col gap-2.5 py-3">
              <span className="h-3 w-full animate-pulse rounded bg-accent-300/40" />
              <span className="h-3 w-[92%] animate-pulse rounded bg-accent-300/40" />
              <span className="h-3 w-[78%] animate-pulse rounded bg-accent-300/40" />
              <span className="h-3 w-[85%] animate-pulse rounded bg-accent-300/40" />
              <span className="mt-1 text-[11.5px] text-foreground/45">Reading “{source.title}”…</span>
            </div>
          ) : error ? (
            <p className="text-[13px]" style={{ color: 'var(--snp-bad)' }}>
              {error}
            </p>
          ) : summary ? (
            <div className="summary-md text-[14px] leading-[1.7] text-foreground">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-3 font-heading text-[26px] tracking-tight">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-2 mt-6 font-heading text-[22px] tracking-tight first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3
                      className="mb-2.5 mt-6 font-heading text-2xl font-bold tracking-tight text-indigo-950"
                      style={{ color: 'var(--color-accent-700)' }}
                    >
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4
                      className="mb-2.5 mt-6 font-heading text-[20px] font-semibold tracking-tight first:mt-0"
                      style={{ color: 'var(--color-accent-700)' }}
                    >
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => <p className="mb-3 text-justify leading-[1.7]">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="mb-4 list-disc space-y-2 pl-5 marker:text-foreground/40">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 list-decimal space-y-2 pl-5 marker:text-foreground/40">{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-[1.65] pl-0.5">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-medium" style={{ color: 'var(--color-accent-800)' }}>
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                  hr: () => <hr className="my-5 border-border" />,
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
