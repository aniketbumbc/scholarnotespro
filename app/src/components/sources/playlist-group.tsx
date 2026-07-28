'use client';
import { useState } from 'react';
import { ChevronRight, Check, CircleAlert, Loader2,ListVideo, Trash2 } from 'lucide-react';
import type { Source } from '../../lib/type';
import type { PlaylistGroup as Group } from '../../lib/groupSources';

export function PlaylistGroup({
  group,
  selectedId,
  onSelect,
  onDelete,
}: {
  group: Group;
  selectedId: string | null;
  onSelect: (s: Source) => void;
  onDelete: (g: Group) => void;
}) {
  const [open, setOpen] = useState(false);

  const readyPct = (group.ready / group.total) * 100;
  const workPct = (group.processing / group.total) * 100;
  const failPct = (group.failed / group.total) * 100;

  const statusLine =
    group.processing > 0
      ? `Series · processing · ${group.ready} ready, ${group.failed} failed`
      : `Series · ${group.total} videos · ${group.ready} ready, ${group.failed} failed`;

  return (
    <div className="rounded-md border border-border bg-background">
      {/* header */}
      <div onClick={() => setOpen((o) => !o)} className="flex cursor-pointer items-center gap-2 p-3">
        <ChevronRight size={14} strokeWidth={1.6} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-heading text-sm leading-tight">
    <ListVideo size={14} strokeWidth={1.6} style={{ color: 'var(--color-accent-700)' }} className="shrink-0" />
    {group.title}
  </div>
          <div className="mt-1 text-[11px] tabular-nums text-foreground/55">{statusLine}</div>
          {/* aggregate progress bar: green ready / accent processing / red failed */}
          <div className="mt-1.5 flex h-[3px] overflow-hidden rounded-sm bg-accent-300/40">
            <span style={{ width: `${readyPct}%`, background: 'var(--snp-ok)' }} />
            <span style={{ width: `${workPct}%`, background: 'var(--color-accent-500)' }} />
            <span style={{ width: `${failPct}%`, background: 'var(--snp-bad)' }} />
          </div>
        </div>
        <button
    onClick={(e) => { e.stopPropagation(); onDelete(group); }}
    className="p-0.5 text-foreground/40 hover:text-[var(--snp-bad)]"
    aria-label="Delete series"
  >
    <Trash2 size={13} strokeWidth={1.5} />
  </button>
        <span className="self-start rounded-full border border-border px-1.5 py-px text-[10px] text-foreground/55">
          Playlist
        </span>
      </div>

      {/* expanded video rows */}
      {open && (
        <div className="flex flex-col gap-0.5 border-t border-border py-2 pl-6 pr-2">
          {group.videos.map((v, i) => (
            <VideoRow key={v.sourceId} video={v} index={i + 1} selected={v.sourceId === selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoRow({
  video, index, selected, onSelect,
}: { video: Source; index: number; selected: boolean; onSelect: (s: Source) => void }) {
  const ready = video.status === 'ready';

  if (video.status === 'failed') {
    return (
      <div className="rounded-sm px-[7px] py-1.5" style={{ background: 'color-mix(in srgb, var(--snp-bad) 6%, transparent)' }}>
        <div className="flex items-center gap-[7px]">
          <CircleAlert size={11} strokeWidth={1.8} style={{ color: 'var(--snp-bad)' }} className="shrink-0" />
          <span className="flex-1 text-[12.5px] leading-tight text-foreground/70">{index} · {video.title}</span>
          <span className="text-[10.5px]" style={{ color: 'var(--snp-bad)' }}>Failed</span>
        </div>
        <div className="mt-1 flex items-center gap-2 pl-[18px]">
          <span className="flex-1 text-[10.5px] leading-snug text-foreground/55">{video.error ?? 'No transcript available.'}</span>
          <button className="rounded border px-[7px] py-px text-[10.5px]" style={{ borderColor: 'color-mix(in srgb, var(--snp-bad) 45%, transparent)', color: 'var(--snp-bad)' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => ready && onSelect(video)}
      className={`flex items-center gap-[7px] rounded-sm border border-transparent px-[7px] py-1.5 ${
        ready ? 'cursor-pointer hover:border-accent-400' : 'cursor-not-allowed opacity-60'
      } ${selected ? 'border-accent bg-accent-100/40' : ''}`}
    >
      {ready ? (
        <Check size={10} strokeWidth={3} style={{ color: 'var(--snp-ok)' }} className="shrink-0" />
      ) : (
        <Loader2 size={10} strokeWidth={3} style={{ color: 'var(--color-accent-600)' }} className="shrink-0 animate-spin" />
      )}
      <span className="flex-1 text-[12.5px] leading-tight">{index} · {video.title}</span>
      <span className="text-[11px] tabular-nums text-foreground/45">{video.status === 'ready' ? '' : 'processing'}</span>
    </div>
  );
}