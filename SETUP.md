# Nova Storefront — setup guide

A standalone e-commerce store. Customers browse products, pay with **Apple Pay /
card (Stripe)** or **PayPal**, and the moment a payment clears you get an instant
**Telegram** message with the item(s) and the customer's shipping address. You then
place the matching order with your supplier and ship straight to the customer.

Nothing on the public site references any supplier — it's a fully standalone brand.
The private supplier links live only in your password-protected **admin dashboard**.

> **How fulfilment works (important):** this store is *semi-automated* by design.
> There is no public API to place supplier orders programmatically, and automating a
> supplier's website against your account risks getting it banned. Instead, every paid
> order lands in `/admin` with a one-click "Order" button (opens the exact product) and
> a "Copy address" button. Placing the order takes ~60 seconds and keeps your supplier
> account safe.

---

## 0. Prerequisites

- A [Vercel](https://vercel.com) account (free tier is fine) with this repo connected — or any Node host.
- A Postgres database (Vercel Postgres, Neon, or Supabase — all have free tiers).
- A [Stripe](https://dashboard.stripe.com) account (for cards + Apple Pay).
- A [PayPal Developer](https://developer.paypal.com) account.
- The Telegram app on your phone.

Budget ~30–40 minutes the first time.

## 1. Deploy & database

1. Import the repo into Vercel.
2. **Storage → Create Database → Postgres.** Vercel adds `DATABASE_URL` automatically.
3. The build runs `prisma db push` for you, so tables are created on first deploy.
   (Locally: `npm install`, set `DATABASE_URL` in `.env`, then `npm run db:push`.)

## 2. Branding

Set these env vars (all optional — defaults shown in `.env.example`):

- `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_CURRENCY` / `NEXT_PUBLIC_CURRENCY_SYMBOL`
- `NEXT_PUBLIC_SHIPPING_CENTS`, `NEXT_PUBLIC_FREE_SHIP_CENTS`
- `NEXT_PUBLIC_SITE_URL` — your final domain (used in notification links & redirects).

The accent colour lives in `tailwind.config.ts` under `colors.brand` — change that one
block to re-skin the whole site.

## 3. Stripe (Apple Pay + cards)

1. Stripe Dashboard → **Developers → API keys** → copy the **Secret key** into `STRIPE_SECRET_KEY`.
2. **Developers → Webhooks → Add endpoint:**
   - URL: `https://YOUR-DOMAIN/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.
3. Apple Pay & Google Pay appear automatically on Stripe's hosted checkout — no extra
   config needed. (To offer Apple Pay on your *own* domain later you'd register it in
   Stripe → Payment method domains; the hosted page needs nothing.)

## 4. PayPal

1. [developer.paypal.com](https://developer.paypal.com) → **Apps & Credentials**.
2. Create an app; copy **Client ID** → `PAYPAL_CLIENT_ID` **and** `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
3. Copy **Secret** → `PAYPAL_CLIENT_SECRET`.
4. Keep `PAYPAL_ENV="sandbox"` while testing; switch to `"live"` with live credentials to go live.

If PayPal env vars are absent the PayPal button simply doesn't show — the rest of the
store still works.

## 5. Telegram sale notifications

1. In Telegram, message **@BotFather** → `/newbot` → follow prompts → copy the **token**
   into `TELEGRAM_BOT_TOKEN`.
2. Open a chat with your new bot and send it any message (e.g. "hi").
3. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser and copy the
   `"chat":{"id": ...}` number into `TELEGRAM_CHAT_ID`.

Now every paid order pings your phone instantly. (No token set = notifications are
skipped; checkout still works.)

## 6. Admin dashboard

1. Set `ADMIN_PASSWORD` to a strong password and `ADMIN_SECRET` to
   `openssl rand -base64 24`.
2. Go to `https://YOUR-DOMAIN/admin/login`, sign in, and you'll see every order with its
   shipping address and one-click supplier links.

---

## Adding products

Products live in **`src/data/products.ts`**. To add one:

1. Put its images in `public/products/<slug>/` (e.g. `1.jpg`, `2.jpg`).
2. Add an entry to the `products` array with title, price (in **cents**), images,
   highlights, etc.
3. Put the **private supplier link** in `sourceUrl` — it's shown only in `/admin`,
   never to customers.

The placeholder demo products and the `scripts/gen-placeholders.js` helper can be
deleted once you've added real items.

> Just share supplier product links and the catalog entries (localised images + rewritten
> copy) can be filled in for you.

## Local development

```bash
npm install
cp .env.example .env   # fill in what you have
npm run db:push        # once DATABASE_URL is set
npm run dev            # http://localhost:3000
```

## Test the full flow

- Use Stripe **test mode** keys and card `4242 4242 4242 4242` (any future date / CVC).
- Use PayPal **sandbox** buyer credentials.
- Complete a test purchase → confirm the Telegram ping and the order in `/admin`.
