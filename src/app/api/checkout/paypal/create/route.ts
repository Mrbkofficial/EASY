import { NextRequest, NextResponse } from 'next/server';
import { checkoutSchema, createPendingOrder } from '@/lib/checkout';
import { createPaypalOrder, paypalConfigured } from '@/lib/payments';
import { prisma } from '@/lib/prisma';
import { storeConfig } from '@/lib/store.config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal is not configured yet.' }, { status: 503 });
  }

  let parsed;
  try {
    parsed = checkoutSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid checkout details.' }, { status: 400 });
  }

  try {
    const order = await createPendingOrder(parsed, storeConfig.currency);
    const paypalOrder = await createPaypalOrder({
      amountCents: order.total,
      currency: order.currency,
      reference: order.reference,
    });

    // Remember the PayPal id so capture can find our order.
    await prisma.order.update({
      where: { id: order.id },
      data: { provider: 'paypal', providerRef: paypalOrder.id },
    });

    return NextResponse.json({ paypalOrderId: paypalOrder.id });
  } catch (err) {
    console.error('[checkout/paypal/create]', err);
    return NextResponse.json({ error: 'Could not start PayPal checkout.' }, { status: 500 });
  }
}
