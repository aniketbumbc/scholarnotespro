'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const HIGHLIGHT_BG = 'color-mix(in srgb, var(--color-accent) 38%, transparent)';

function normalize(s: string) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find snippet in concatenated page text; return [start, end) in that string. */
function findMatch(haystack: string, snippet: string): { start: number; end: number } | null {
  const cleaned = normalize(snippet);
  if (!cleaned || !haystack) return null;

  const words = cleaned.split(' ').filter(Boolean);
  const lengths = [
    words.length,
    Math.min(words.length, 24),
    Math.min(words.length, 12),
    8,
    5,
    3,
  ].filter((n, i, arr) => n >= 3 && arr.indexOf(n) === i);

  for (const n of lengths) {
    const window = words.slice(0, n).join(' ');
    const pattern = new RegExp(window.split(/\s+/).map(escapeRegExp).join('\\s+'), 'i');
    const m = haystack.match(pattern);
    if (m && m.index !== undefined) {
      let end = m.index + m[0].length;
      // Grow match with remaining snippet words while they still align
      let i = n;
      while (i < words.length) {
        const grow = haystack.slice(end).match(new RegExp(`^\\s*${escapeRegExp(words[i])}`, 'i'));
        if (!grow) break;
        end += grow[0].length;
        i += 1;
      }
      return { start: m.index, end };
    }
  }

  const probe = cleaned.slice(0, 40);
  const idx = haystack.indexOf(probe);
  if (idx >= 0) return { start: idx, end: idx + probe.length };
  return null;
}

function clearHighlights(root: HTMLElement) {
  root.querySelectorAll('.react-pdf__Page__textContent span').forEach((s) => {
    const el = s as HTMLElement;
    el.style.background = '';
    el.style.boxShadow = '';
    el.classList.remove('pdf-cite-hit');
  });
}

/**
 * PDF.js splits lines into many tiny spans. Match across the concatenated text,
 * then paint every span that overlaps the matched range.
 */
function applySnippetHighlight(root: HTMLElement, snippet: string): HTMLElement | null {
  clearHighlights(root);
  const spans = Array.from(
    root.querySelectorAll('.react-pdf__Page__textContent span'),
  ) as HTMLElement[];
  if (!spans.length || !snippet.trim()) return null;

  // Build haystack + per-span char offsets (join with spaces — mirrors visual gaps)
  let haystack = '';
  const ranges: Array<{ el: HTMLElement; start: number; end: number }> = [];
  for (const el of spans) {
    const text = el.textContent ?? '';
    if (!text) continue;
    // Prefer joining without extra space when the span already has trailing/leading space
    const needsSpace = haystack.length > 0 && !/\s$/.test(haystack) && !/^\s/.test(text);
    if (needsSpace) haystack += ' ';
    const start = haystack.length;
    haystack += text;
    ranges.push({ el, start, end: haystack.length });
  }

  const match = findMatch(haystack, snippet);
  if (!match) {
    // Last resort: highlight first span that contains any distinctive word (≥5 chars)
    const word = normalize(snippet).split(' ').find((w) => w.length >= 5);
    if (word) {
      const hit = spans.find((s) => (s.textContent ?? '').toLowerCase().includes(word));
      if (hit) {
        hit.style.background = HIGHLIGHT_BG;
        hit.classList.add('pdf-cite-hit');
        return hit;
      }
    }
    return null;
  }

  let first: HTMLElement | null = null;
  for (const { el, start, end } of ranges) {
    if (end <= match.start || start >= match.end) continue;
    el.style.background = HIGHLIGHT_BG;
    el.style.boxShadow = 'inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 35%, transparent)';
    el.classList.add('pdf-cite-hit');
    if (!first) first = el;
  }
  return first;
}

export function PdfViewer({
  sourceId,
  page,
  snippet,
  seekKey,
  title,
}: {
  sourceId: string;
  page: number;
  snippet?: string;
  seekKey?: number;
  title?: string;
}) {
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(Math.max(1, page));
  const [width, setWidth] = useState(320);
  const [textReady, setTextReady] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageBoxRef = useRef<HTMLDivElement>(null);

  const fileUrl = `/api/sources/${sourceId}/file`;

  useEffect(() => {
    setCurrent(Math.max(1, page));
  }, [page, sourceId, seekKey]);

  useEffect(() => {
    const el = pageBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 40) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const runHighlight = useCallback(() => {
    if (!snippet || !containerRef.current) return;
    const first = applySnippetHighlight(containerRef.current, snippet);
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [snippet]);

  // Re-highlight when citation changes or text layer finishes
  useEffect(() => {
    if (!snippet) return;
    const t1 = window.setTimeout(runHighlight, 50);
    const t2 = window.setTimeout(runHighlight, 250);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [snippet, seekKey, current, sourceId, textReady, runHighlight]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[12px]">
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--color-accent-700)' }}
        >
          PDF
        </span>
        <span className="min-w-0 flex-1 truncate text-foreground/55">{title ?? sourceId}</span>
        <button
          type="button"
          onClick={() => setCurrent((p) => Math.max(1, p - 1))}
          className="p-1 disabled:opacity-40"
          disabled={current <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="tabular-nums text-foreground/55">
          Page {current} of {numPages || '…'}
        </span>
        <button
          type="button"
          onClick={() => setCurrent((p) => Math.min(numPages || current, p + 1))}
          className="p-1 disabled:opacity-40"
          disabled={numPages > 0 && current >= numPages}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto bg-card/30 p-3">
        <div ref={pageBoxRef} className="mx-auto w-full">
          <Document
            file={fileUrl}
            loading={
              <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-foreground/45">
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-accent-600)' }} />
                Loading PDF…
              </div>
            }
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          >
            <Page
              key={`${sourceId}-${current}-${seekKey ?? 0}`}
              pageNumber={current}
              width={width}
              renderTextLayer
              renderAnnotationLayer={false}
              onRenderTextLayerSuccess={() => setTextReady((n) => n + 1)}
              loading={
                <div className="flex h-40 items-center justify-center text-[12px] text-foreground/40">
                  Rendering page…
                </div>
              }
              className="overflow-hidden rounded-md border border-border bg-white shadow-sm"
            />
          </Document>
        </div>
        {snippet && (
          <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-foreground/40">
            Highlighting: “{snippet.slice(0, 140)}
            {snippet.length > 140 ? '…' : ''}”
          </p>
        )}
      </div>
    </div>
  );
}
