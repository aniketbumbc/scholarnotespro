'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export function AuthGate({ children }: { children: (user: AuthUser) => React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('not authed');
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => {
        router.replace('/login');   // not logged in → go to login
      })
      .finally(() => setChecking(false));
  }, [router]);

  // while checking — show a loader (avoids flashing the app or login)
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin" style={{ color: 'var(--color-accent-600)' }} />
      </div>
    );
  }

  // not authed — redirect already fired, render nothing
  if (!user) return null;

  // authed — render the app, passing the user down
  return <>{children(user)}</>;
}