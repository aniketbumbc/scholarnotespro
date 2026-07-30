'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from './src/components/layout/app-shell';
import { SourcesPanel } from './src/components/sources/sources-panel';
import { ChatPanel } from './src/components/chat/chat-panel';
import { ViewerPanel } from './src/components/viewer/viewer-panel';
import { api } from './src/lib/api';
import type { Source, ViewerTarget } from './src/lib/type';
import { Tab, TabBar } from './src/components/center/tab-bar';
import { SummaryTab } from './src/components/center/summary-tab';
import { TimelineTab } from './src/components/center/timeline-tab';
import { StudyGuideTab } from './src/components/center/study-guide-tab';

export default function Home() {
  const [selected, setSelected] = useState<Source | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [viewerTarget, setViewerTarget] = useState<ViewerTarget | null>(null);
  const [seekKey, setSeekKey] = useState(0);
  const [tab, setTab] = useState<Tab>('chat');

  const load = useCallback(() => {
    api.listSources().then(setSources).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const pending = sources.some((s) => s.status === 'processing' || s.status === 'queued');
    if (!pending) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [sources, load]);

  const onCite = useCallback((t: ViewerTarget) => {
    setViewerTarget(t);
    setSeekKey((k) => k + 1);
  }, []);

  const loadIntoViewer = useCallback((s: Source | null) => {
    if (!s || s.status !== 'ready') return;
    if (s.sourceType === 'pdf') {
      setViewerTarget({ kind: 'pdf', sourceId: s.sourceId, page: 1 });
      setSeekKey((k) => k + 1);
    } else if (s.sourceType === 'youtube' && s.videoId) {
      setViewerTarget({ kind: 'video', videoId: s.videoId, startSeconds: 0 });
      setSeekKey((k) => k + 1);
    }
  }, []);

  const onTab = useCallback(
    (t: Tab) => {
      setTab(t);
      if (t === 'summary' || t === 'guide') loadIntoViewer(selected);
    },
    [selected, loadIntoViewer]
  );

  const onSelectSource = useCallback(
    (s: Source | null) => {
      setSelected(s);
      if (tab === 'summary' || tab === 'guide') loadIntoViewer(s);
    },
    [tab, loadIntoViewer]
  );

  const videoTitle =
    viewerTarget?.kind === 'video'
      ? sources.find((s) => s.videoId === viewerTarget.videoId)?.title
      : undefined;

  const pdfTitle =
    viewerTarget?.kind === 'pdf'
      ? sources.find((s) => s.sourceId === viewerTarget.sourceId)?.title
      : undefined;

  return (
    <AppShell
      sources={<SourcesPanel selectedId={selected?.sourceId ?? null} onSelect={onSelectSource} />}
      center={
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
          <TabBar tab={tab} onTab={onTab} sourceLabel={selected?.title} />
          <div className="min-h-0 overflow-hidden">
            {tab === 'chat' && <ChatPanel sources={sources} onCite={onCite} />}
            {tab === 'summary' && <SummaryTab source={selected} />}
            {tab === 'timeline' && <TimelineTab source={selected} onSeek={onCite} />}
            {tab === 'guide' && <StudyGuideTab source={selected} />}
            {/* other tabs → Steps 8–12 */}
          </div>
        </div>
      }
      viewer={
        <ViewerPanel
          target={viewerTarget}
          seekKey={seekKey}
          videoTitle={videoTitle}
          pdfTitle={pdfTitle}
        />
      }
      
    />
  );
}
