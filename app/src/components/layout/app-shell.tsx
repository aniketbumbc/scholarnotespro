import { Header } from './header';

export function AppShell({
  sources,
  center,
  viewer,
  userEmail,
  onLogout,
  sourceStats,
}: {
  sources: React.ReactNode;
  center: React.ReactNode;
  viewer: React.ReactNode;
  userEmail: string;
  onLogout: () => void;
  sourceStats: { total: number; ready: number };
}) {
  return (
    <div className="grid h-screen grid-rows-[auto_1fr] overflow-x-auto overflow-y-hidden bg-background text-foreground">
      <Header userEmail={userEmail} onLogout={onLogout} sourceStats={sourceStats}/>

      <div className="grid min-h-0 min-w-[1280px] grid-cols-[274px_minmax(560px,1fr)_minmax(340px,460px)]">
        {/* left — sources */}
        <aside className="grid min-h-0 grid-rows-[auto_auto_1fr] border-r border-border bg-card/45">
          {sources}
        </aside>

        {/* center — chat / tabs */}
        <main className="min-h-0 overflow-hidden">
          {center}
        </main>

        {/* right — viewer */}
        <section className="min-h-0 overflow-hidden border-l border-border bg-card/30">
          {viewer}
        </section>
      </div>
    </div>
  );
}