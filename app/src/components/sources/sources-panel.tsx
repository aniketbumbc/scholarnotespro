'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import type { Source } from '../../lib/type';
import { SourceCard } from './source-card';
import { groupSources } from '../../lib/groupSources';
import { PlaylistGroup } from './playlist-group';
import { AddSourceModal } from './add-source-modal';
import { DeleteModal, type DeleteTarget } from './delete-modal';



export function SourcesPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (s: Source) => void;
}) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSourceModalOpen, setAddSourceModalOpen] = useState(false);
  const { standalone, groups } = groupSources(sources);
  const [delTarget, setDelTarget] = useState<DeleteTarget | null>(null);



  const load = useCallback(async () => {
    try {
      const list = await api.listSources();
      setSources(list);
    } catch (e) {
      console.error('Failed to load sources', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // poll while any source is still processing/queued
  useEffect(() => {
    const pending = sources.some((s) => s.status === 'processing' || s.status === 'queued');
    if (!pending) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [sources, load]);

  const requestDeleteSource = (s: Source) =>
    setDelTarget({ kind: 'source', id: s.sourceId, title: s.title });

  const doDelete = async (t: DeleteTarget) => {
    if (t.kind === 'source') await api.deleteSource(t.id);
    else if (t.kind === 'playlist') await api.deletePlaylist(t.id);
    else await api.deleteAll();
    load();  // refresh the list
  };

  return (
    <>
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <h6 className="font-heading text-[11px] uppercase tracking-wider">Sources</h6>
        <button onClick={() => setDelTarget({ kind: 'all', count: sources.length })} className="px-1.5 py-0.5 text-[11px] text-foreground/55 hover:text-foreground">
          Delete all
        </button>
      </div>

      <div className="px-3 pb-3">
        <button onClick={() => setAddSourceModalOpen(true)} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-[13px] text-primary-foreground hover:bg-accent-700">
          <Plus size={14} /> Add source
        </button>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto px-3 pb-6">
  {loading ? (
    <div className="py-8 text-center text-xs text-foreground/40">Loading sources…</div>
  ) : sources.length === 0 ? (
    <div className="py-8 text-center text-xs text-foreground/40">
      No sources yet. Add a PDF or YouTube link.
    </div>
  ) : (
    <>
      {standalone.map((s) => (
        <SourceCard
          key={s.sourceId}
          source={s}
          selected={s.sourceId === selectedId}
          onSelect={onSelect}
          onDelete={requestDeleteSource}
        />
      ))}
      {groups.map((g) => (
        <PlaylistGroup
          key={g.playlistId}
          group={g}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={(g) => setDelTarget({ kind: 'playlist', id: g.playlistId, title: g.title, count: g.total })}
        />
      ))}
    </>
  )}
</div>
<AddSourceModal open={addSourceModalOpen} onOpenChange={setAddSourceModalOpen} onAdded={load} />
<DeleteModal target={delTarget} onConfirm={doDelete} onClose={() => setDelTarget(null)} />
    </>
  );
}