// Runs during `npm run build` so the database schema is created/updated
// automatically on every deploy — no manual `prisma db push` needed.
//
// Robustness: different Vercel Postgres / Neon integrations expose the
// connection string under different names, and DDL (schema push) must run over
// a DIRECT (non-pooling) connection — a pooled/pgbouncer endpoint rejects it.
// So we try each candidate URL, direct ones first, until one succeeds. If none
// work we log loudly but DO NOT fail the build — the app still deploys, and
// /api/health will report that the schema needs pushing, which is far easier to
// debug than a dead deployment.
const { execSync } = require('child_process');

const candidates = [
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.DATABASE_URL_UNPOOLING,
  process.env.DATABASE_URL_UNPOOLED,
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
].filter((v, i, a) => v && a.indexOf(v) === i);

if (candidates.length === 0) {
  console.warn('[build-db-push] No database URL found — skipping schema sync. Attach a Postgres database and redeploy.');
  process.exit(0);
}

let pushed = false;
for (const url of candidates) {
  try {
    console.log('[build-db-push] Pushing schema using', maskUrl(url));
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: url },
    });
    pushed = true;
    break;
  } catch (err) {
    console.warn('[build-db-push] Push failed on this URL:', err.message?.split('\n')[0]);
  }
}

if (!pushed) {
  console.warn('[build-db-push] Could not push the schema with any known DB URL. Deploy will continue; visit /api/health after deploy to see the database status.');
}
process.exit(0); // never fail the build over schema sync

function maskUrl(u) {
  try {
    const parsed = new URL(u);
    return `${parsed.protocol}//***@${parsed.host}${parsed.pathname}`;
  } catch {
    return '(db url)';
  }
}
