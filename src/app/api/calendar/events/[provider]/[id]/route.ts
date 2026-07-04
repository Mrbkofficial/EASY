import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId, AuthError } from '@/lib/session';
import { updateGoogleEvent, deleteGoogleEvent } from '@/lib/googleCalendar';
import { updateOutlookEvent, deleteOutlookEvent } from '@/lib/outlook';

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  allDay: z.boolean().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

type Params = { params: { provider: 'google' | 'outlook'; id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const body = updateSchema.parse(await req.json());
    if (params.provider === 'google') {
      await updateGoogleEvent(userId, params.id, body);
    } else {
      await updateOutlookEvent(userId, params.id, body);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    if (params.provider === 'google') {
      await deleteGoogleEvent(userId, params.id);
    } else {
      await deleteOutlookEvent(userId, params.id);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
