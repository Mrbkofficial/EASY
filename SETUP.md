# Setting up Easy

Easy is a Next.js app (frontend + API routes in one project) meant to be deployed on
**Vercel**, with a Postgres database, and connected to your Google, Microsoft and
Apple Mail accounts. None of the third-party integrations will work until you provide
your own credentials below — that's expected, this is a one-time setup.

Budget ~30-45 minutes the first time. You only do this once.

## 0. Prerequisites

- A [Vercel](https://vercel.com) account (free tier is enough), with this GitHub repo connected.
- A Google account and a Microsoft account (whichever ones you want the app to read/write).
- An Apple ID with iCloud Mail, if you want Apple Mail support.

## 1. Create the database

1. In your Vercel project → **Storage** tab → **Create Database** → **Postgres** (Neon).
2. Once created, Vercel automatically adds a `DATABASE_URL` (or `POSTGRES_PRISMA_URL`) env
   var to your project. Copy it into `DATABASE_URL` in your env vars if it isn't named exactly
   that — Prisma expects the variable to be called `DATABASE_URL`.
3. After your first deploy (or locally with the var set), run:
   ```bash
   npx prisma db push
   ```
   This creates all the tables. Re-run it any time `prisma/schema.prisma` changes.

## 2. Create a Vercel Blob store (for receipt photos)

Storage tab → **Create Database** → **Blob**. Link it to the project — Vercel adds
`BLOB_READ_WRITE_TOKEN` automatically. No manual copying needed.

## 3. Generate app secrets

Run these locally and paste the output into your env vars:

```bash
openssl rand -base64 32   # -> NEXTAUTH_SECRET
openssl rand -base64 32   # -> APPLE_MAIL_ENCRYPTION_KEY
openssl rand -base64 24   # -> CRON_SECRET
```

For push notifications:

```bash
npm install
npx web-push generate-vapid-keys
```

Copy the printed `Public Key` into `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `Private Key` into
`VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT` to `mailto:your-email@example.com`.

## 4. Google Cloud — Gmail + Calendar (Personal mode)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project
   (e.g. "Easy Assistant").
2. **APIs & Services → Library**: enable the **Gmail API** and the **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: External (or Internal if you have Workspace).
   - Add your own Google account as a **test user** (required while the app is unpublished —
     that's fine for personal use, you never need to submit for verification).
   - Scopes: you don't need to add them here; they're requested at sign-in time.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs — add **both** of these (replace with your real domain):
     ```
     https://your-app.vercel.app/api/auth/callback/google
     https://your-app.vercel.app/api/connections/google/callback
     ```
   - Save. Copy the **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` /
     `GOOGLE_CLIENT_SECRET`.

## 5. Microsoft Azure AD — Outlook Mail + Calendar (Work mode)

1. Go to [Azure Portal](https://portal.azure.com/) → **Microsoft Entra ID** →
   **App registrations** → **New registration**.
2. Name it "Easy Assistant". Supported account types: usually
   "Accounts in any organizational directory and personal Microsoft accounts" unless your
   work tenant restricts this — ask your IT admin if unsure.
3. Redirect URI: platform **Web**, add:
   ```
   https://your-app.vercel.app/api/auth/callback/azure-ad
   ```
   Then go to **Authentication** after creation and add a second redirect URI:
   ```
   https://your-app.vercel.app/api/connections/microsoft/callback
   ```
4. **Certificates & secrets → New client secret** — copy the **value** immediately (it's
   only shown once) into `AZURE_AD_CLIENT_SECRET`.
5. Copy **Application (client) ID** into `AZURE_AD_CLIENT_ID`.
6. Copy **Directory (tenant) ID** into `AZURE_AD_TENANT_ID` — or leave it as `common` if you
   want any Microsoft account (personal or work) to be able to sign in.
7. **API permissions → Add a permission → Microsoft Graph → Delegated permissions**, add:
   `Mail.ReadWrite`, `Mail.Send`, `Calendars.ReadWrite`, `offline_access`, `openid`,
   `profile`, `email`. If your tenant requires admin consent, click **Grant admin consent**
   (or ask whoever manages your work Microsoft 365 to do so).

## 6. Apple / iCloud Mail

No developer setup needed — this uses IMAP with an **app-specific password**, generated
per-user, right from the app's Settings page:

1. Go to [appleid.apple.com](https://appleid.apple.com) → **Sign-In and Security** →
   **App-Specific Passwords** → generate one, name it "Easy".
2. In the app: **Settings → Apple / iCloud Mail**, enter your iCloud email and the generated
   password (format `xxxx-xxxx-xxxx-xxxx`). Never enter your real Apple ID password here.

## 7. Deploy

1. Push this repo to GitHub (already done if you're reading this from the repo) and import it
   into Vercel.
2. Add every env var from `.env.example` in **Project Settings → Environment Variables**.
3. Deploy. Then run `npx prisma db push` once (locally, pointed at the production
   `DATABASE_URL`, or via a one-off Vercel deployment build step) to create the tables.
4. Visit your deployed URL, sign in with Google or Microsoft, and connect the remaining
   accounts from **Settings**.

### Reminders & push notifications

`vercel.json` already defines a cron job (`/api/cron/reminders`, every 5 minutes) — Vercel
picks it up automatically on deploy, no extra setup. If you set `CRON_SECRET`, the route
only accepts requests carrying it; Vercel's cron runner sends it automatically once you set
`CRON_SECRET` as a Vercel **Cron Job Secret** in Project Settings → Cron Jobs (or simply as a
regular env var — the route checks `Authorization: Bearer $CRON_SECRET`).

## 8. Install to your Home Screen

Once deployed (HTTPS is required for both PWA install and push notifications):

- **iOS**: open the site in Safari → Share → **Add to Home Screen**.
- **Android**: open in Chrome → menu → **Install app** (or you'll see an automatic install
  banner).
- **Desktop**: Chrome/Edge show an install icon in the address bar.

The first time you open the installed app, allow the notification permission prompt so
task reminders can reach you.

## Local development

```bash
npm install
cp .env.example .env
# fill in at least DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL=http://localhost:3000,
# APPLE_MAIL_ENCRYPTION_KEY — the rest can be added incrementally.
npx prisma db push
npm run dev
```

Note: OAuth redirect URIs must match exactly, so for local development you'll want a
second Google/Azure OAuth client (or additional redirect URIs) pointing at
`http://localhost:3000/...` instead of your production domain.

## What each mode shows

- **Personal mode**: Google Calendar, Gmail, and Apple/iCloud Mail.
- **Work mode**: Outlook Calendar and Outlook Mail (Microsoft/Graph).

Tasks and budget entries are tagged by mode and are otherwise the same feature set in
both — switch modes from the pill control in the top bar / sidebar.
