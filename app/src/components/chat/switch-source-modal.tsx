'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Source } from '../../lib/type';

export function SwitchSourceModal({
  pending,
  currentTitle,
  onConfirm,
  onCancel,
}: {
  pending: Source | null;
  currentTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!pending) return null;

  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-[460px] p-6">
        <div className="font-heading text-[24px] leading-none">Switch source?</div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/68">
          Switching to “{pending.title}” will clear your current chat
          {currentTitle ? ` about “${currentTitle}”` : ''}. This cannot be undone.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
          >
            Stay here
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-accent-700"
          >
            Switch & clear chat
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
