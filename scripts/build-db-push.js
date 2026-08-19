// Runs during `npm run build` so the database schema is created/updated
// automatically on every deploy — no manual `prisma db push` needed.
// Skips quietly if no database URL is set yet (e.g. before Postgres is attached).
const { execSync } = require('child_process');

// Prefer a DIRECT (non-pooling) connection for `prisma db push` — DDL over a
// pooled/pgbouncer endpoint can fail. Fall back across the names different
// Vercel Postgres / Neon integrations use.
const pushUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!pushUrl) {
  console.warn(
    '[build-db-push] No database URL found (DATABASE_URL / POSTGRES_URL_NON_POOLING / POSTGRES_URL) — skipping schema sync. Attach a Postgres database and redeploy.'
  );
  process.exit(0);
}

try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: pushUrl },
  });
} catch (err) {
  console.error('[build-db-push] prisma db push failed:', err.message);
  process.exit(1);
}
