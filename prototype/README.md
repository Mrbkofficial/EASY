# Daba — Rabat ride-hailing prototype

An interactive, **frontend-only prototype** of a ride-hailing app for **Rabat, Morocco**,
in the style of **Uber** and **Careem (UAE)**. It is meant for demoing and validating the
end-to-end flow *before* a production build — every payment, driver, and trip is **mock
data**, and there is **no backend**.

> **Brand note:** This uses an original brand — **Daba** (دابا, Moroccan Darija for
> *"now"*) — rather than a real company's name or logo, so it can be shared safely. It is
> fully rebrandable; the flow deliberately mirrors Uber/Careem.

## Run it

It's a single self-contained HTML file. No build, no install:

```bash
# just open it
open prototype/index.html        # macOS
xdg-open prototype/index.html    # Linux
# or drag the file into any browser
```

Open your browser's device toolbar (or use a phone) for the intended mobile view. All state
is saved to `localStorage`; use **Menu → Réinitialiser la démo** to start over.

## What's in the flow

**Passenger (rider)**
- Phone + OTP login (demo code: `0000`)
- Map of Rabat with real districts (Agdal, Hay Riad, Souissi, Médina…) and landmarks
  (Tour Hassan, Kasbah des Oudayas, Gare Rabat-Ville, Aéroport Rabat-Salé…)
- Destination search, ride tiers (**Go / Confort / XL / Moto**) with live **MAD** fares
- Payment methods: **cash**, **card** (mock add), **Daba Pay wallet** (mock top-up),
  **promo codes** (`RABAT10`, `BIENVENUE`)
- Live captain matching → captain en route → trip in progress (animated map marker) →
  fare breakdown, receipt, rate + tip
- Ride history

**Captain (driver)**
- 3-step registration: personal info → vehicle → documents (mock upload) → review →
  auto-approval
- Go online/offline, incoming ride offers with a 10s accept/decline countdown
- Navigate to pickup → start trip → complete → cash collection
- Earnings dashboard (today + weekly chart)

Switch between rider and captain from the in-app menu.

## Handoff notes for developers

This file is a **UX/interaction spec**, not production code. When building for real, the
obvious integration points are:

| Prototype (mock) | Production |
| --- | --- |
| `localStorage` state | Auth + backend DB (users, drivers, rides) |
| Fake OTP `0000` | Real SMS OTP (e.g. Twilio) |
| Stylized SVG map | Google Maps / Mapbox with geocoding & routing |
| `fareFor()` estimate | Server-side pricing + surge |
| Mock card / wallet | Payment gateway (CMI, Stripe, cash reconciliation) |
| `setTimeout` matching | Real-time driver dispatch (WebSocket / push) |
| Auto-approve captain | KYC / document verification workflow |

Localization is French (with Arabic touches) to match Rabat; Arabic (RTL) and English are
natural next steps.
