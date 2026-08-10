import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/payments';
import { prisma } from '@/lib/prisma';
import { notifyOwnerOfSale } from '@/lib/notify';

// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get('stripe-signature');
  if (!secret || !sig) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('[webhooks/stripe] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await markOrderPaid(orderId, 'stripe', session.id);
    }
  }

  return NextResponse.json({ received: true });
}

async function markOrderPaid(orderId: string, provider: string, providerRef: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  if (order.status === 'PAID' || order.status === 'FULFILLED') return; // idempotent

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID', provider, providerRef },
    include: { items: true },
  });

  await notifyOwnerOfSale(updated);
}
