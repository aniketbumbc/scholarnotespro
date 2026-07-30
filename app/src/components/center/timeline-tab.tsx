'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';
import { api } from '../../lib/api';
import type { Source, TimelineChapter, ViewerTarget } from '../../lib/type';
import { TabGenerationLoader } from './tab-generation-loader';

export function TimelineTab({
  source,
  onSeek,
}: {
  source: Source | null;
  onSeek: (t: ViewerTarget) => void;
}) {
  const [chapters, setChapters] = useState<TimelineChapter[]>([]);
  const [videoId, setVideoId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const generate = async (sourceId: string) => {
    setLoading(true);
    setError(null);
    setChapters([]);
    try {
      const res = await api.timeline(sourceId);
      setChapters(res.chapters);
      setVideoId(res.videoId);
      setLoadedId(sourceId);
    } catch (e) {
      setError((e as Error).message ?? 'Could not generate timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (source?.status === 'ready' && source.sourceType === 'youtube' && source.sourceId !== loadedId) {
      generate(source.sourceId);
    }
  }, [source?.sourceId, source?.status]);

  // no source
  if (!source) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-foreground/40">
        <p>Select a video from the left panel to see its timeline.</p>
      </div>
    );
  }

  // PDF selected — timelines are video-only
  if (source.sourceType !== 'youtube') {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-foreground/40">
        <p>Timelines are only available for YouTube videos.<br />“{source.title}” is a PDF — try the Summary or Study guide tab.</p>
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
          <h2 className="font-heading text-[27px]">Video timeline</h2>
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
            <TabGenerationLoader title={source.title} label="Timeline generation" />
          ) : error ? (
            <p className="text-[13px]" style={{ color: 'var(--snp-bad)' }}>{error}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {chapters.map((ch, i) => (
                <ChapterRow key={i} chapter={ch} videoId={videoId} onSeek={onSeek} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterRow({
  chapter, videoId, onSeek,
}: { chapter: TimelineChapter; videoId: string; onSeek: (t: ViewerTarget) => void }) {
  return (
    <button
      onClick={() => onSeek({ kind: 'video', videoId, startSeconds: chapter.startSeconds })}
      className="group flex items-start gap-3 rounded-md border border-transparent px-3 py-2.5 text-left hover:border-accent-400 hover:bg-accent-100/30"
    >
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
        style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent-700)' }}
      >
        <Play size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[15px] leading-tight">{chapter.title}</span>
          <span className="tabular-nums text-[11.5px]" style={{ color: 'var(--color-accent-700)' }}>
            {fmt(chapter.startSeconds)}–{fmt(chapter.endSeconds)}
          </span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-foreground/60">{chapter.description}</p>
      </div>
    </button>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}