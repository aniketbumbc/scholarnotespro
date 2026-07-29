'use client';

import dynamic from 'next/dynamic';
import { Loader2, Play } from 'lucide-react';
import type { ViewerTarget } from '../../lib/type';
import { YouTubePlayer } from './youtube-player';

const PdfViewer = dynamic(
  () => import('./pdf-viewer').then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center gap-2 text-[13px] text-foreground/45">
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-accent-600)' }} />
        Loading viewer…
      </div>
    ),
  },
);

export function ViewerPanel({
  target,
  seekKey,
  videoTitle,
  pdfTitle,
}: {
  target: ViewerTarget | null;
  seekKey: number;
  videoTitle?: string;
  pdfTitle?: string;
}) {
  if (!target) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-foreground/40">
        <Play size={22} strokeWidth={1.4} className="opacity-50" />
        <p className="font-heading text-[17px] text-foreground/50">Viewer</p>
        <p className="max-w-[220px] text-[12px] leading-relaxed">
          Click a citation chip in chat to open the source here.
        </p>
      </div>
    );
  }

  if (target.kind === 'video') {
    return (
      <YouTubePlayer
        videoId={target.videoId}
        startSeconds={target.startSeconds}
        seekKey={seekKey}
        title={videoTitle}
      />
    );
  }

  return (
    <PdfViewer
      sourceId={target.sourceId}
      page={target.page}
      snippet={target.snippet}
      seekKey={seekKey}
      title={pdfTitle}
    />
  );
}
