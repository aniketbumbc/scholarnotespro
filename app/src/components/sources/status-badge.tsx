import { Check, CircleAlert, Clock, Loader2 } from 'lucide-react';
import type { SourceStatus } from '../../lib/type';

export function StatusBadge({ status }: { status: SourceStatus }) {
  const base = 'inline-flex items-center gap-1 rounded-full px-[7px] py-px text-[10.5px] border';

  if (status === 'ready')
    return (
      <span className={base} style={{ color: 'var(--snp-ok)', borderColor: 'color-mix(in srgb, var(--snp-ok) 42%, transparent)', background: 'color-mix(in srgb, var(--snp-ok) 9%, transparent)' }}>
        <Check size={9} strokeWidth={3} /> Ready
      </span>
    );

  if (status === 'failed')
    return (
      <span className={base} style={{ color: 'var(--snp-bad)', borderColor: 'color-mix(in srgb, var(--snp-bad) 45%, transparent)' }}>
        <CircleAlert size={9} strokeWidth={2.4} /> Failed
      </span>
    );

  if (status === 'processing')
    return (
      <span className={base} style={{ color: 'var(--color-accent-700)', borderColor: 'var(--color-accent-400)' }}>
        <Loader2 size={9} strokeWidth={3} className="animate-spin" /> Processing…
      </span>
    );

  return (
    <span className={`${base} border-border text-foreground/55`}>
      <Clock size={9} strokeWidth={2} /> Queued
    </span>
  );
}