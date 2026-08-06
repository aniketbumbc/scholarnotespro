'use client';
import { FileText, Play, Trash2 } from 'lucide-react';
import { StatusBadge } from './status-badge';
import type { Source } from '../../lib/type';

export function SourceCard({
  source,
  selected,
  onSelect,
  onDelete,
}: {
  source: Source;
  selected: boolean;
  onSelect: (s: Source) => void;
  onDelete: (s: Source) => void;
}) {
  const ready = source.status === 'ready';
  const Icon = source.sourceType === 'youtube' ? Play : FileText;

  return (
    <div
      onClick={() => ready && onSelect(source)}
      className={`rounded-md border bg-background p-3 transition-colors ${
        ready ? 'cursor-pointer hover:border-accent-400' : 'cursor-not-allowed opacity-60'
      } ${selected ? 'border-accent bg-purple-200/40' : 'border-border'}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={15} strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent-700)' }} />
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[15px] font-semibold leading-tight break-words">{source.title}</div>

          {source.status === 'failed' ? (
            <div className="mt-1.5">
              <StatusBadge status="failed" />
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-1.5">
              <StatusBadge status={source.status} />
              <span className="text-[11px] tabular-nums text-foreground/50">
                {source.sourceType === 'youtube' ? 'Video' : 'PDF'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(source); }}
          className="p-0.5 text-foreground/40 hover:text-accent-700 cursor-pointer"
          aria-label="Delete source"
        >
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}