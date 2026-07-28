'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export type DeleteTarget =
  | { kind: 'source'; id: string; title: string }
  | { kind: 'playlist'; id: string; title: string; count: number }
  | { kind: 'all'; count: number };

export function DeleteModal({
  target, onConfirm, onClose,
}: {
  target: DeleteTarget | null;
  onConfirm: (t: DeleteTarget) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  if (!target) return null;

  const { title, body } = copy(target);

  const run = async () => {
    setBusy(true);
    try { await onConfirm(target); onClose(); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6">
        <div className="font-heading text-[24px] leading-none">{title}</div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/68">{body}</p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card">
            Cancel
          </button>
          <button
            onClick={run}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm text-white disabled:opacity-60"
            style={{ background: 'var(--snp-bad)' }}
          >
            {busy ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : 'Delete'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function copy(t: DeleteTarget): { title: string; body: string } {
  if (t.kind === 'all')
    return {
      title: 'Delete all sources?',
      body: `All ${t.count} sources, their transcripts and every generated summary, timeline and mind map will be removed. This cannot be undone.`,
    };
  if (t.kind === 'playlist')
    return {
      title: 'Delete this series?',
      body: `The whole series (${t.count} videos) and everything generated from it will be removed. This cannot be undone.`,
    };
  return {
    title: 'Delete this source?',
    body: `“${t.title}” and everything generated from it will be removed. Answers that cited it keep their text but lose their links.`,
  };
}