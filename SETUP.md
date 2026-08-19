# Setting up TradeMate

TradeMate is a Next.js app (frontend + API routes in one project) meant to be
deployed on **Vercel** with a **Postgres** database. Email/password sign-in works
out of the box — the only truly required setup is the database. Google sign-in,
push notifications and file storage are optional add-ons.

Budget ~15 minutes the first time.

## 0. Prerequisites

- A [Vercel](https://vercel.com) account (free tier is enough), with this GitHub repo connected.
- Nothing else is required to get a working app.

## 1. Create the database

1. In your Vercel project → **Storage** tab → **Create Database** → **Postgres** (Neon).
2. Vercel automatically adds a `DATABASE_URL` (or `POSTGRES_PRISMA_URL`) env var.
   Make sure a var named exactly `DATABASE_URL` is present (copy the value if needed).
3. The schema is pushed automatically on every deploy (`prisma db push` runs during
   `npm run build`). Locally you can run `npm run db:push`.

## 2. Core environment variables

Set these in Vercel → **Settings → Environment Variables** (and in a local `.env`
for development — see `.env.example`):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | From step 1. |
| `NEXTAUTH_URL` | ✅ | Your deployed URL, e.g. `https://trademate.vercel.app`. Use `http://localhost:3000` locally. |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |

That's enough to sign up with email + password and use every core feature
(customers, jobs, quotes, invoices, WhatsApp sharing, printable PDFs).

## 3. Google sign-in (optional)

If you want a "Continue with Google" button in addition to email/password:

1. [Google Cloud Console](https://console.cloud.google.com) → create OAuth credentials
   (Web application).
2. Authorized redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 4. Photo & document storage for SEAI (optional)

SEAI grant workflows let you attach photos and documents. These are stored in
**Vercel Blob**:

1. Vercel project → **Storage** → **Create** → **Blob**.
2. Link it to the project. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically.

Until this is configured, everything else works — only file uploads on the SEAI
screen are disabled (you'll get a clear message).

## 5. Push notifications (optional)

Powers reminders when an invoice becomes overdue.

1. Generate VAPID keys: `npm run vapid:generate`
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   (e.g. `mailto:you@yourbusiness.ie`).
3. The overdue-invoice sweep runs via `GET /api/cron/reminders`. A `vercel.json`
   cron entry calls it on a schedule; protect it by setting `CRON_SECRET`.

## 6. Deploy

Push to your connected branch and Vercel builds automatically. The build runs
`prisma generate`, pushes the schema, and compiles Next.js.

## Using the app

1. Open the app and **create an account** (email + password).
2. Go to **More → Business profile** and fill in your business name, VAT number,
   bank details and default VAT rate — these appear on your quotes/invoices.
3. Add a **customer**, then create a **job** for them.
4. From the job, create a **quote** → add line items → **Save** → send it over
   **WhatsApp**. When accepted, **convert it to an invoice**.
5. For grant work, open a job and **Start SEAI workflow** to track the evidence
   checklist and capture photos.
6. On your phone, use the browser's **Add to Home Screen** to install it like a
   native app.
