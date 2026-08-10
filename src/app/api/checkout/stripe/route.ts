import { NextRequest, NextResponse } from 'next/server';
import { checkoutSchema, createPendingOrder } from '@/lib/checkout';
import { getStripe, stripeConfigured } from '@/lib/payments';
import { storeConfig } from '@/lib/store.config';

export const dynamic = 'force-dynamic';

function siteUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get('origin') ||
    `https://${req.headers.get('host')}`
  );
}

export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Card payments are not configured yet.' }, { status: 503 });
  }

  let parsed;
  try {
    parsed = checkoutSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid checkout details.' }, { status: 400 });
  }

  try {
    const order = await createPendingOrder(parsed, storeConfig.currency);
    const stripe = getStripe();
    const base = siteUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Apple Pay & Google Pay appear automatically on the hosted page.
      payment_method_types: ['card'],
      customer_email: order.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, reference: order.reference },
      line_items: [
        ...order.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: order.currency,
            unit_amount: item.unitPrice,
            product_data: {
              name: item.title + (item.variant ? ` (${item.variant})` : ''),
              images: item.image.startsWith('http') ? [item.image] : undefined,
            },
          },
        })),
        ...(order.shipping > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: order.currency,
                  unit_amount: order.shipping,
                  product_data: { name: 'Shipping' },
                },
              },
            ]
          : []),
      ],
      success_url: `${base}/order/success?ref=${order.reference}`,
      cancel_url: `${base}/checkout?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout/stripe]', err);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }
}
