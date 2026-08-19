import Link from 'next/link';
import type { Metadata } from 'next';
import { seedDemo, DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demoSeed';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'TradeMate Demo', robots: { index: false } };

export default async function DemoPage() {
  const enabled = process.env.ENABLE_DEMO_SEED === '1';
  let status: 'created' | 'exists' | 'disabled' | 'error' = enabled ? 'exists' : 'disabled';

  if (enabled) {
    try {
      const res = await seedDemo();
      status = res.created ? 'created' : 'exists';
    } catch {
      status = 'error';
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-base-bg px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-base-border bg-base-surface p-6 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-fg">
          <span className="text-2xl">👷</span>
        </div>
        <h1 className="text-xl font-semibold">TradeMate demo</h1>

        {status === 'disabled' ? (
          <p className="mt-3 text-sm text-base-muted">
            Demo seeding is off. Set <code className="rounded bg-base-surface2 px-1">ENABLE_DEMO_SEED=1</code> in your
            environment variables and redeploy, then reload this page to create the sample account.
          </p>
        ) : status === 'error' ? (
          <p className="mt-3 text-sm text-danger">
            Could not seed the demo — check that <code className="rounded bg-base-surface2 px-1">DATABASE_URL</code> is set
            and the schema has been pushed.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-base-muted">
              {status === 'created' ? 'Sample account created.' : 'Sample account ready.'} Sign in with:
            </p>
            <div className="mt-4 space-y-1 rounded-xl bg-base-surface2 p-4 text-left text-sm">
              <p>
                <span className="text-base-muted">Email:</span> <span className="font-medium">{DEMO_EMAIL}</span>
              </p>
              <p>
                <span className="text-base-muted">Password:</span> <span className="font-medium">{DEMO_PASSWORD}</span>
              </p>
            </div>
            <Link
              href="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg shadow-soft"
            >
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
