import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';

const schema = z.object({
  pushEnabled: z.boolean().optional(),
  defaultReminderMins: z.number().int().min(0).optional(),
  quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return NextResponse.json({ preference: pref });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await req.json());
    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });
    return NextResponse.json({ preference: pref });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
