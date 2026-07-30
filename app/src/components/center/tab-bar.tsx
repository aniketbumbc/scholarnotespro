'use client';
export type Tab = 'chat' | 'summary' | 'timeline' | 'guide' | 'map' | 'faq';

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'summary', label: 'Summary' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'guide', label: 'Study Guide' },
  { id: 'map', label: 'Mind Map' },
];

export function TabBar({ tab, onTab, sourceLabel }: { tab: Tab; onTab: (t: Tab) => void; sourceLabel?: string }) {
  return (
    <div className="flex items-center gap-5 border-b border-border px-6">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          className="border-b-2 py-3 text-[13px] transition-colors cursor-pointer"
          style={{
            borderColor: tab === t.id ? 'var(--color-accent)' : 'transparent',
            color: tab === t.id ? 'var(--color-accent-700)' : 'var(--color-text)',
          }}
        >
          {t.label}
        </button>
      ))}
      <span className="flex-1" />
      {sourceLabel && (
        <span className="text-[12px] italic text-foreground/50">on {sourceLabel}</span>
      )}
    </div>
  );
}