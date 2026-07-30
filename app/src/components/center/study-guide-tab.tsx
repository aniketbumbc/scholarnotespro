
'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';
import type { Source, StudyGuideResult } from '../../lib/type';

export function StudyGuideTab({ source }: { source: Source | null }) {
  const [guide, setGuide] = useState<StudyGuideResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const generate = async (sourceId: string) => {
    setLoading(true);
    setError(null);
    setGuide(null);
    try {
      const res = await api.studyGuide(sourceId);
      setGuide(res);
      setLoadedId(sourceId);
    } catch (e) {
      setError((e as Error).message ?? 'Could not generate study guide');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (source?.status === 'ready' && source.sourceId !== loadedId) {
      generate(source.sourceId);
    }
  }, [source?.sourceId, source?.status]);

  if (!source) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-foreground/40">
        <p>Select a source from the left panel to build a study guide.</p>
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
          <h2 className="font-heading text-[27px]">Study guide</h2>
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
            <div className="flex flex-col gap-3 py-3">
              <span className="h-4 w-1/3 animate-pulse rounded bg-accent-300/40" />
              <span className="h-3 w-full animate-pulse rounded bg-accent-300/30" />
              <span className="h-3 w-[88%] animate-pulse rounded bg-accent-300/30" />
              <span className="mt-1 text-[11.5px] text-foreground/45">Building the study guide…</span>
            </div>
          ) : error ? (
            <p className="text-[13px]" style={{ color: 'var(--snp-bad)' }}>{error}</p>
          ) : guide ? (
            <div className="flex flex-col gap-6">
              {/* Overview */}
              <section>
                <SectionLabel>Overview</SectionLabel>
                <p className="text-justify text-[14px] leading-[1.7]">{guide.overview}</p>
              </section>

              {/* Key concepts */}
              <section>
                <SectionLabel>Key concepts</SectionLabel>
                <div className="flex flex-col gap-2">
                  {guide.keyConcepts.map((c, i) => (
                    <div key={i} className="rounded-md border border-border p-3">
                      <div className="font-heading text-[15px]">{c.term}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground/70">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Summary points */}
              <section>
                <SectionLabel>Key takeaways</SectionLabel>
                <ul className="flex flex-col gap-1.5">
                  {guide.summaryPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed">
                      <span style={{ color: 'var(--color-accent-600)' }}>•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Practice questions — collapsible */}
              <section>
                <SectionLabel>Practice questions</SectionLabel>
                <div className="flex flex-col gap-2">
                  {guide.practiceQuestions.map((q, i) => (
                    <PracticeQ key={i} question={q.question} answer={q.answer} />
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h6 className="mb-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-accent-700)' }}>
      {children}
    </h6>
  );
}

function PracticeQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--color-accent-600)' }} />
        <span className="text-[14px] font-heading">{question}</span>
      </button>
      {open && (
        <p className="border-t border-border px-3 py-2.5 text-[13px] leading-relaxed text-foreground/70">
          {answer}
        </p>
      )}
    </div>
  );
}