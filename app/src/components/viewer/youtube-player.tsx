'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

type YTPlayer = {
  destroy: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  loadVideoById: (opts: { videoId: string; startSeconds?: number }) => void;
  getVideoData: () => { video_id?: string };
};

type YTNamespace = {
  Player: new (
    el: HTMLElement | string,
    opts: {
      width?: string | number;
      height?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<void> | null = null;

function whenYouTubeApiReady(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!apiReady) {
    apiReady = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      // Script may already be mid-load with no callback set yet
      if (window.YT?.Player) resolve();
    });
  }
  return apiReady;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function YouTubePlayer({
  videoId,
  startSeconds,
  seekKey,
  title,
}: {
  videoId: string;
  startSeconds: number;
  /** Bumps on every citation click so re-clicking the same chip seeks again. */
  seekKey: number;
  title?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const targetRef = useRef({ videoId, startSeconds });
  targetRef.current = { videoId, startSeconds };

  useEffect(() => {
    let cancelled = false;

    whenYouTubeApiReady().then(() => {
      if (cancelled || !wrapperRef.current || !window.YT?.Player) return;

      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      readyRef.current = false;

      // YT replaces the mount node with an iframe — always inject a fresh one
      const wrapper = wrapperRef.current;
      wrapper.innerHTML = '';
      const mount = document.createElement('div');
      mount.style.width = '100%';
      mount.style.height = '100%';
      wrapper.appendChild(mount);

      const start = Math.max(0, Math.floor(targetRef.current.startSeconds));
      playerRef.current = new window.YT.Player(mount, {
        width: '100%',
        height: '100%',
        videoId: targetRef.current.videoId,
        playerVars: {
          start,
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            readyRef.current = true;
            const t = targetRef.current;
            e.target.seekTo(Math.max(0, t.startSeconds), true);
            e.target.playVideo();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;

    const start = Math.max(0, startSeconds);
    const currentId = player.getVideoData()?.video_id;

    if (currentId === videoId) {
      player.seekTo(start, true);
      player.playVideo();
    } else {
      player.loadVideoById({ videoId, startSeconds: start });
    }
  }, [videoId, startSeconds, seekKey]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" />

      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--color-accent-700)' }}
        >
          Video
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/55">
          {title ?? videoId}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-foreground/40">
          ▶ {fmt(startSeconds)}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
          <div ref={wrapperRef} className="absolute inset-0" />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-foreground/40">
          Citation chips seek this player to the cited timestamp.
        </p>
      </div>
    </div>
  );
}
