import { ThemeToggle } from '../themeToggle';
import { AuthUser } from '../auth/auth-gate';
import { Logo } from '../logo';


export function Header({
  userEmail,
  onLogout,
  sourceStats,
}: {
  userEmail: string;
  onLogout: () => void;
  sourceStats: { total: number; ready: number };
}) {
  return (
    <header className="flex h-[54px] min-w-[1180px] items-center gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Logo size={24} />
        <span className="font-heading text-[21px] tracking-tight">Scholar Notes Pro</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/45">
          Notes desk
        </span>
      </div>

      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-xs tabular-nums text-foreground/50">
          {sourceStats.total} {sourceStats.total === 1 ? 'source' : 'sources'} · {sourceStats.ready} ready
        </span>
        <ThemeToggle />
        <div className="h-[22px] w-px bg-border" />   {/* divider */}
        <span className="text-xs text-foreground/55">{userEmail}</span>
        <button
          onClick={onLogout}
          className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:bg-(--color-accent-700)"
        >
          Log out
        </button>
      </div>
    </header>
  );
}