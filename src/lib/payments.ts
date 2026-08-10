// Server-side helpers for Stripe and PayPal. Both are lazily initialised so the
// app builds and runs even before keys are added (checkout just returns a clear
// error until you configure them).

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }
  return stripeClient;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// ---- PayPal REST (Orders v2) --------------------------------------------------

function paypalBase(): string {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function paypalAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PayPal credentials are not set');

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPaypalOrder(params: {
  amountCents: number;
  currency: string;
  reference: string;
}): Promise<{ id: string }> {
  const token = await paypalAccessToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.reference,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: (params.amountCents / 100).toFixed(2),
          },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string };
}

export async function capturePaypalOrder(paypalOrderId: string): Promise<{ status: string }> {
  const token = await paypalAccessToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { status: string };
}
