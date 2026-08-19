# TradeMate — Irish Trades Job Manager

A lightweight, mobile-first CRM built for Irish trades (plumbing, electrical,
insulation and more). Manage customers and jobs, send VAT-correct quotes and
invoices, document SEAI grant work, and share quotes to customers over WhatsApp
— all from your phone, installable as a PWA.

## Features

- **Jobs & Customers CRM** — a client book and a job pipeline (Lead → Quoted →
  Scheduled → In progress → Completed → Invoiced), tagged by trade.
- **Quotes & Invoicing** — line items with Irish VAT rates (23% / 13.5% / 9% /
  0%), automatic per-user numbering, printable/PDF documents, one-tap
  "convert quote → invoice", and mark-as-paid.
- **WhatsApp quotes** — share a quote or invoice to the customer via a pre-filled
  `wa.me` deep link, with a public view-only link. No paid WhatsApp API needed.
- **SEAI grant documentation** — start a grant workflow on any job (attic /
  cavity / wall insulation, heat pump, solar PV, heating controls, windows…).
  Each measure ships with the standard evidence checklist (pre/post BER,
  Declaration of Works, product certs, photos). Capture photos and documents
  straight from the phone camera.
- **Installable PWA** — add to home screen, works full-screen, with optional
  push reminders for overdue invoices.

## Tech stack

- Next.js 14 (App Router) + React 18, TypeScript
- Tailwind CSS, Framer Motion, Lucide icons
- Prisma + PostgreSQL
- NextAuth (email/password by default, optional Google)
- Vercel Blob (photo/document storage), Web Push (VAPID)

## Getting started

1. `npm install`
2. Copy `.env.example` → `.env` and set at least `DATABASE_URL`,
   `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
3. `npm run db:push` to create the schema.
4. `npm run dev` and open http://localhost:3000 — create an account with email
   and password.

See [SETUP.md](./SETUP.md) for full deployment instructions (Vercel + Postgres +
optional Google sign-in, push and file storage).

## VAT note

Default line-item VAT is **13.5%**, the reduced rate that applies to most Irish
construction/repair labour; materials/goods usually take the **23%** standard
rate. Set your own default in **More → Business profile → Invoicing**. This app
helps you produce documents — it is not tax advice; confirm the correct rate for
each supply with your accountant or Revenue.
