import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { capturePaypalOrder, paypalConfigured } from '@/lib/payments';
import { prisma } from '@/lib/prisma';
import { notifyOwnerOfSale } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ paypalOrderId: z.string().min(1) });

export async function POST(req: NextRequest) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal is not configured yet.' }, { status: 503 });
  }

  let paypalOrderId: string;
  try {
    paypalOrderId = bodySchema.parse(await req.json()).paypalOrderId;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const capture = await capturePaypalOrder(paypalOrderId);
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed.' }, { status: 402 });
    }

    const order = await prisma.order.findFirst({
      where: { providerRef: paypalOrderId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Idempotent: only mark + notify on the first successful capture.
    if (order.status === 'PENDING') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
        include: { items: true },
      });
      await notifyOwnerOfSale(updated);
    }

    return NextResponse.json({ reference: order.reference });
  } catch (err) {
    console.error('[checkout/paypal/capture]', err);
    return NextResponse.json({ error: 'Could not complete PayPal payment.' }, { status: 500 });
  }
}
