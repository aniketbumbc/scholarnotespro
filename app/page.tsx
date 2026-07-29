'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from './src/components/layout/app-shell';
import { SourcesPanel } from './src/components/sources/sources-panel';
import { ChatPanel } from './src/components/chat/chat-panel';
import { api } from './src/lib/api';
import type { Source, ViewerTarget } from './src/lib/type';
import { Tab, TabBar } from './src/components/chat/center/tab-bar';

export default function Home() {
  const [selected, setSelected] = useState<Source | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [viewerTarget, setViewerTarget] = useState<ViewerTarget | null>(null);
  const [tab, setTab] = useState<Tab>('chat');


  const load = useCallback(() => {
    api.listSources().then(setSources).catch(() => {});
  }, []);
  
  useEffect(() => { load(); }, [load]);
  
  useEffect(() => {
    const pending = sources.some((s) => s.status === 'processing' || s.status === 'queued');
    if (!pending) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [sources, load]);

  return (
    <AppShell
      sources={<SourcesPanel selectedId={selected?.sourceId ?? null} onSelect={setSelected} />}
      center={
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
          <TabBar tab={tab} onTab={setTab} sourceLabel={selected?.title} />
          <div className="min-h-0 overflow-hidden">
            {tab === 'chat' && <ChatPanel sources={sources} onCite={setViewerTarget} />}
            {tab === 'summary' && <div className="p-8 text-foreground/40">Summary (Step 8)</div>}
            {/* other tabs → Steps 8–12 */}
          </div>
        </div>
      }
      viewer={
        <div className="flex items-center justify-center p-4 text-center text-foreground/40">
          {viewerTarget
            ? `Viewer target: ${JSON.stringify(viewerTarget)}`
            : 'Click a citation to open the source here (Steps 13–14)'}
        </div>
      }
    />
  );
}