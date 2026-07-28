'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { api } from '../../lib/api';

type Tab = 'pdf' | 'yt';

export function AddSourceModal({
  open, onOpenChange, onAdded,
}: { open: boolean; onOpenChange: (o: boolean) => void; onAdded: () => void }) {
  const [tab, setTab] = useState<Tab>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setFile(null); setUrl(''); setError(null); setBusy(false); };
  const close = () => { reset(); onOpenChange(false); };

  const commit = async () => {
    setError(null); setBusy(true);
    try {
      if (tab === 'pdf') {
        if (!file) { setError('Choose a PDF first.'); setBusy(false); return; }
        const form = new FormData();
        form.append('file', file);
        form.append('title', file.name.replace(/\.pdf$/i, ''));
        const res = await api.uploadPdf(form);
        if (res.error) throw new Error(res.error);
      } else {
        if (!url.trim()) { setError('Paste a YouTube URL.'); setBusy(false); return; }
        await api.addYouTube(url.trim());
      }
      onAdded();
      close();
    } catch (e) {
      setError((e as Error).message ?? 'Failed to add');
      setBusy(false);
    }
  };

  const canAdd = tab === 'pdf' ? !!file : !!url.trim();

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-[520px] p-6 bg-background/90">
        <div className="font-heading text-[26px] leading-none">Add a source</div>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/55">
          PDFs are parsed page by page; YouTube links are transcribed. Playlists arrive as a series.
        </p>

        {/* underline tabs */}
        <div className="mt-5 grid grid-cols-2 rounded-md border border-border">
          <TabBtn active={tab === 'pdf'} onClick={() => { setTab('pdf'); setError(null); }}>Upload PDF</TabBtn>
          <TabBtn active={tab === 'yt'} onClick={() => { setTab('yt'); setError(null); }}>YouTube URL</TabBtn>
        </div>

        <div className="mt-4 min-h-[190px]">
          {tab === 'pdf'
            ? <PdfTab file={file} onFile={setFile} />
            : <YtTab url={url} onUrl={setUrl} />}
        </div>

        {error && <p className="mt-1 text-[12px]" style={{ color: 'var(--snp-bad)' }}>{error}</p>}

        {/* footer */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={close} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card">
            Cancel
          </button>
          <button
            onClick={commit}
            disabled={!canAdd || busy}
            className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm disabled:opacity-45"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent-700)' }}
          >
            {busy ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add source'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="border-b-2 py-2.5 text-[13px] transition-colors"
      style={{
        borderColor: active ? 'var(--color-accent)' : 'transparent',
        color: active ? 'var(--color-accent-700)' : 'var(--color-text)',
      }}
    >
      {children}
    </button>
  );
}

/* ---- PDF tab: drop zone + staged file row ---- */
function PdfTab({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-9 text-center transition-colors"
        style={{
          borderColor: dragging ? 'var(--color-accent)' : 'var(--color-accent-300)',
          background: dragging ? 'color-mix(in srgb, var(--color-accent) 6%, transparent)' : 'color-mix(in srgb, var(--color-accent) 3%, transparent)',
        }}
      >
        <Upload size={22} strokeWidth={1.4} style={{ color: 'var(--color-accent-600)' }} />
        <div className="font-heading text-[17px]">Drop a PDF here</div>
        <div className="text-[12px] text-foreground/55">
          or <span style={{ color: 'var(--color-accent-700)' }}>browse your files</span> · up to 10 MB
        </div>
        <input ref={inputRef} type="file" accept="application/pdf" hidden
               onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-2 text-[13px]">
          <FileText size={14} strokeWidth={1.5} className="text-foreground/60" />
          <span>{file.name}</span>
          <span className="text-foreground/45">· {(file.size / 1024 / 1024).toFixed(1)} MB</span>
          <span className="flex-1" />
          <span style={{ color: 'var(--color-accent-700)' }}>ready to add</span>
        </div>
      )}
    </div>
  );
}

/* ---- YouTube tab: URL + playlist-detected preview ---- */
function YtTab({ url, onUrl }: { url: string; onUrl: (u: string) => void }) {
  const isPlaylist = /[?&]list=/.test(url) && /\/playlist/.test(url);

  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-foreground/55">
        Video or playlist URL
      </label>
      <input
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        placeholder="https://youtube.com/watch"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {isPlaylist && (
        <div className="mt-3 rounded-md border border-border p-3">
          <span className="rounded border px-2 py-0.5 text-[11px]"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent-700)' }}>
            Playlist detected
          </span>
          <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/65">
            Each video becomes its own source inside a collapsible series, so you can scope
            questions to one part or the whole course.
          </p>
        </div>
      )}
    </div>
  );
}