'use client';
import { useState } from 'react';
import { AppShell } from './src/components/layout/app-shell';
import { SourcesPanel } from './src/components/sources/sources-panel';
import type { Source } from './src/lib/type';

export default function Home() {
  const [selected, setSelected] = useState<Source | null>(null);

  return (
    <AppShell
      sources={<SourcesPanel selectedId={selected?.sourceId ?? null} onSelect={setSelected} />}
      center={
        <div className="flex items-center justify-center text-foreground/40">
          {selected ? `Selected: ${selected.title}` : 'Select a source'}
        </div>
      }
      viewer={<div className="flex items-center justify-center text-foreground/40">Viewer (Step 13)</div>}
    />
  );
}