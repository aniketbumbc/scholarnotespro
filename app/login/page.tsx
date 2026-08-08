'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, BookOpen, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '../src/components/themeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' ? { email, password } : { email, password, name };
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      router.push('/');               // into the app
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* ambient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 15%, color-mix(in srgb, var(--color-accent-300) 35%, transparent), transparent), ' +
            'radial-gradient(ellipse 70% 55% at 85% 85%, color-mix(in srgb, var(--color-accent-500) 28%, transparent), transparent), ' +
            'radial-gradient(ellipse 60% 50% at 90% 10%, color-mix(in srgb, var(--color-accent-200) 40%, transparent), transparent)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* top bar: theme + docs */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Link
          href="/docs"
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground/70 hover:bg-card hover:text-foreground"
        >
          <BookOpen size={14} />
          How it works
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-[380px]">
        {/* brand */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-[38px] leading-none">ScholarNotesPro</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-foreground/45">
            Research desk
          </p>
        </div>

        {/* card */}
        <div className="rounded-lg border border-border bg-card/70 p-6 shadow-xl backdrop-blur-md">
          <h2 className="font-heading text-[22px]">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-[12.5px] text-foreground/55">
            {mode === 'login'
              ? 'Sign in to your notebook.'
              : 'Start building your research library.'}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {mode === 'signup' && (
              <Field label="Name (optional)">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Aniket"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="input"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  className="input pr-9"
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="text-[12px]" style={{ color: 'var(--snp-bad)' }}>{error}</p>
            )}

            <button
              onClick={submit}
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-primary py-2.5 text-[14px] text-primary-foreground hover:bg-accent-700 disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </div>

        {/* toggle */}
        <p className="mt-4 text-center text-[12.5px] text-foreground/55">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="font-medium hover:underline"
            style={{ color: 'var(--color-accent-700)' }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-foreground/50">
        {label}
      </span>
      {children}
    </label>
  );
}