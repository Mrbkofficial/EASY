// Runs during `npm run build` so the database schema is created/updated
// automatically on every deploy — no manual `prisma db push` needed.
// Skips quietly if DATABASE_URL isn't set yet (e.g. before Postgres storage is attached).
const { execSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  console.warn('[build-db-push] DATABASE_URL is not set — skipping schema sync. Add a Postgres database and redeploy.');
  process.exit(0);
}

try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' });
} catch (err) {
  console.error('[build-db-push] prisma db push failed:', err.message);
  process.exit(1);
}
