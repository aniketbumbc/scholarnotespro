import { ThemeToggle } from '../themeToggle';

export function Header() {
  return (
    <header className="flex h-[54px] min-w-[1180px] items-center gap-4 border-b border-border bg-background px-4">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-[21px] tracking-tight">Scholar Notes Pro</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/45">
          Notes desk
        </span>
      </div>


     
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* <span className="text-xs tabular-nums text-foreground/50">6 sources · 4 ready</span> */}
        <ThemeToggle />
      </div>
    </header>
  );
}