import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public diagnostics for deployment setup. Reports which required env vars are
// present (booleans only — never their values) and whether the database is
// reachable and migrated. Safe to expose: leaks no secrets.
export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    ENABLE_DEMO_SEED: process.env.ENABLE_DEMO_SEED === '1',
  };

  let database: 'ok' | 'unreachable' | 'not_migrated' = 'ok';
  let detail: string | null = null;

  try {
    // Reachability
    await prisma.$queryRaw`SELECT 1`;
    // Schema present? (throws P2021 if the table doesn't exist)
    await prisma.user.count();
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e?.code === 'P2021' || /does not exist/i.test(e?.message ?? '')) {
      database = 'not_migrated';
      detail = 'Tables are missing — the schema was not pushed during build. Check that DATABASE_URL was set at build time, then redeploy.';
    } else {
      database = 'unreachable';
      detail = 'Could not connect to the database. Check DATABASE_URL (use the direct/non-pooling connection string).';
    }
  }

  const ok = env.DATABASE_URL && env.NEXTAUTH_SECRET && database === 'ok';
  return NextResponse.json({ ok, env, database, detail }, { status: ok ? 200 : 503 });
}
