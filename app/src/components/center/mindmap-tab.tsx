'use client';
import { useEffect, useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { treeToFlow } from '../../lib/mindMapLayout';
import type { Source, MindMapResult, ViewerTarget } from '../../lib/type';
import { Handle, Position } from '@xyflow/react';

export function MindMapTab({
  source,
  onNodeClick,
}: {
  source: Source | null;
  onNodeClick: (t: ViewerTarget) => void;
}) {
  const [data, setData] = useState<MindMapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const generate = async (sourceId: string) => {
    setLoading(true); setError(null); setData(null);
    try {
      const res = await api.mindMap(sourceId);
      setData(res); setLoadedId(sourceId);
    } catch (e) {
      setError((e as Error).message ?? 'Could not generate mind map');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (source?.status === 'ready' && source.sourceId !== loadedId) generate(source.sourceId);
  }, [source?.sourceId, source?.status]);

  const { nodes, edges } = useMemo(() => data ? treeToFlow(data.root) : { nodes: [], edges: [] }, [data]);
  console.log('[mindmap] nodes:', nodes.length, 'edges:', edges.length);

  const handleNodeClick = (_: any, node: Node) => {
    const d = node.data as any;
    if (d.startSeconds !== undefined && data?.sourceType === 'youtube') {
      // videoId lives on the result, not each node
      const videoId = (data as any).videoId ?? source?.videoId;
      onNodeClick({ kind: 'video', videoId, startSeconds: d.startSeconds });
    } else if (d.page !== undefined) {
      onNodeClick({ kind: 'pdf', sourceId: source!.sourceId, page: d.page, snippet: d.snippet });
    }
  };

  if (!source) return <Centered>Select a source to build a mind map.</Centered>;
  if (source.status !== 'ready') return <Centered>“{source.title}” is still processing.</Centered>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h2 className="font-heading text-[20px]">Mind map</h2>
        <button onClick={() => generate(source.sourceId)} disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-[12px] hover:bg-card disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Regenerate
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <Centered>Building the mind map…</Centered>
        ) : error ? (
          <Centered><span style={{ color: 'var(--snp-bad)' }}>{error}</span></Centered>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={{ mindNode: MindNode }}
            onNodeClick={handleNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

/* custom node — shows title + its anchor (page or timestamp) */
function MindNode({ data }: { data: any }) {
    const anchor = data.startSeconds !== undefined ? fmt(data.startSeconds)
      : data.page !== undefined ? `p.${data.page}` : '';
    return (
      <div className="cursor-pointer rounded-md border bg-background px-3 py-2 text-[13px] shadow-sm hover:border-accent-400"
        style={{ borderColor: 'var(--color-accent-300)', maxWidth: 200 }}>
        {/* target handle — where incoming edges connect (left side) */}
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
  
        <div className="font-heading leading-tight">{data.label}</div>
        {anchor && <div className="mt-0.5 text-[10.5px] tabular-nums" style={{ color: 'var(--color-accent-700)' }}>{anchor}</div>}
  
        {/* source handle — where outgoing edges start (right side) */}
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      </div>
    );
  }

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center p-8 text-center text-foreground/40">{children}</div>;
}
function fmt(s: number) { const m = Math.floor(s/60); return `${m}:${String(s%60).padStart(2,'0')}`; }