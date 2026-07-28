'use client';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs">
      Light / Dark
    </button>
  );
}