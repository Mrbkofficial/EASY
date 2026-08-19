import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushToUser } from '@/lib/push';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured — allow (document this in SETUP.md)
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// Runs on a schedule (see vercel.json). Flips sent invoices that have passed their
// due date to OVERDUE and pushes a reminder to the tradesperson who owns them.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const overdue = await prisma.invoice.findMany({
    where: { status: 'SENT', dueDate: { lt: now } },
    include: { customer: { select: { name: true } } },
  });

  let notified = 0;
  for (const inv of overdue) {
    await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'OVERDUE' } });

    const pref = await prisma.notificationPreference.findUnique({ where: { userId: inv.userId } });
    if (pref && !pref.invoiceDueReminders) continue;

    try {
      await sendPushToUser(inv.userId, {
        title: 'Invoice overdue',
        body: `${inv.number} for ${inv.customer.name} (${formatCurrency(inv.total)}) is now overdue.`,
        url: `/invoices/${inv.id}`,
      });
      notified++;
    } catch {
      // VAPID not configured or send failed — status update still stands.
    }
  }

  return NextResponse.json({ ok: true, markedOverdue: overdue.length, notified });
}
