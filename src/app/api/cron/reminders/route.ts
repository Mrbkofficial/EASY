import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured — allow (document this in SETUP.md)
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// Runs every 5 minutes (see vercel.json). Finds tasks whose next reminder offset
// has just come due and pushes a notification, without re-sending ones already fired.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      completed: false,
      dueAt: { not: null },
      reminderOffsets: { isEmpty: false },
    },
  });

  let sent = 0;

  for (const task of tasks) {
    if (!task.dueAt) continue;
    const dueTimes = task.reminderOffsets
      .map((mins) => new Date(task.dueAt!.getTime() - mins * 60_000))
      .filter((t) => t <= now)
      .filter((t) => !task.lastNotifiedAt || t > task.lastNotifiedAt)
      .sort((a, b) => b.getTime() - a.getTime());

    if (dueTimes.length === 0) continue;

    try {
      await sendPushToUser(task.userId, {
        title: task.title,
        body: task.dueAt <= now ? 'Due now' : `Due ${task.dueAt.toLocaleString()}`,
        url: '/dashboard',
      });
      await prisma.task.update({ where: { id: task.id }, data: { lastNotifiedAt: now } });
      sent += 1;
    } catch (err) {
      console.error(`Failed to notify task ${task.id}`, err);
    }
  }

  return NextResponse.json({ ok: true, checked: tasks.length, sent });
}
