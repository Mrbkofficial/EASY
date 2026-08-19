'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { HardHat, Wrench, ReceiptEuro, FileCheck2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function LoginClient({ providers }: { providers: string[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState({ name: '', businessName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            businessName: form.businessName,
            email: form.email,
            password: form.password,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(typeof data?.error === 'string' ? data.error : 'Could not create account');
        }
      }
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) throw new Error('Invalid email or password');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-base-bg px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-fg shadow-soft">
            <HardHat size={26} />
          </div>
          <h1 className="text-2xl font-semibold text-base-text">TradeMate</h1>
          <p className="mt-1.5 text-sm text-base-muted">
            Jobs, quotes &amp; invoices for Irish trades — built for the van, not the office.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 text-center text-xs text-base-muted">
          <div className="flex flex-col items-center gap-1.5">
            <Wrench size={18} className="text-accent" />
            Job tracking
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ReceiptEuro size={18} className="text-accent" />
            VAT invoices
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <FileCheck2 size={18} className="text-accent" />
            SEAI grants
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <Input placeholder="Your name" value={form.name} onChange={set('name')} required />
              <Input
                placeholder="Business name (e.g. O'Brien Plumbing)"
                value={form.businessName}
                onChange={set('businessName')}
              />
            </>
          )}
          <Input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <Input
            type="password"
            placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
            value={form.password}
            onChange={set('password')}
            required
          />

          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        {providers.includes('google') && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-base-muted">
              <div className="h-px flex-1 bg-base-border" /> or <div className="h-px flex-1 bg-base-border" />
            </div>
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-base-border bg-base-surface px-4 py-3 text-sm font-medium text-base-text shadow-soft transition hover:bg-base-surface2 active:scale-[0.98]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-base-muted">
          {mode === 'signup' ? 'Already have an account?' : 'New to TradeMate?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError(null);
            }}
            className="font-medium text-accent hover:underline"
          >
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.8 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C37.4 39.9 44 34 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
