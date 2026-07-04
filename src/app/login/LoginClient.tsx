'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Sparkles, ListChecks, Wallet, BellRing } from 'lucide-react';

export function LoginClient({ providers }: { providers: string[] }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-base-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-fg shadow-soft">
            <Sparkles size={26} />
          </div>
          <h1 className="text-2xl font-semibold text-base-text">Welcome to Easy</h1>
          <p className="mt-1.5 text-sm text-base-muted">
            Your tasks, calendar, mail and budget — together in one clean place.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3 text-center text-xs text-base-muted">
          <div className="flex flex-col items-center gap-1.5">
            <ListChecks size={18} className="text-accent" />
            Tasks &amp; reminders
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <BellRing size={18} className="text-accent" />
            Live alerts
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Wallet size={18} className="text-accent" />
            Budget tracking
          </div>
        </div>

        <div className="space-y-3">
          {providers.includes('google') ? (
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-base-border bg-base-surface px-4 py-3 text-sm font-medium text-base-text shadow-soft transition hover:bg-base-surface2 active:scale-[0.98]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          ) : (
            <p className="rounded-xl border border-dashed border-base-border p-3 text-center text-xs text-base-muted">
              Google sign-in isn&apos;t configured yet. Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — see SETUP.md.
            </p>
          )}

          {providers.includes('azure-ad') ? (
            <button
              onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-base-border bg-base-surface px-4 py-3 text-sm font-medium text-base-text shadow-soft transition hover:bg-base-surface2 active:scale-[0.98]"
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </button>
          ) : (
            <p className="rounded-xl border border-dashed border-base-border p-3 text-center text-xs text-base-muted">
              Microsoft sign-in isn&apos;t configured yet. Add AZURE_AD_CLIENT_ID / SECRET / TENANT_ID — see SETUP.md.
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-base-muted">
          Apple Mail can be connected later from Settings using an app-specific password.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.8 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5.001 0 .001 0 0 0l6.6 5.4C37.4 39.9 44 34 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}
