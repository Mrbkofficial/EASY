import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId, AuthError } from '@/lib/session';
import { listGoogleEvents, createGoogleEvent } from '@/lib/googleCalendar';
import { listOutlookEvents, createOutlookEvent } from '@/lib/outlook';
import { isGoogleConnected } from '@/lib/google';
import { isMicrosoftConnected } from '@/lib/graph';

// Personal mode surfaces Google Calendar; Work mode surfaces Outlook Calendar.
// If the "expected" provider for a mode isn't connected, we fall back to whichever is.
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const mode = searchParams.get('mode') ?? 'PERSONAL';
    if (!from || !to) return NextResponse.json({ error: 'from and to are required' }, { status: 400 });

    const [hasGoogle, hasMicrosoft] = await Promise.all([isGoogleConnected(userId), isMicrosoftConnected(userId)]);

    const wantGoogle = mode === 'PERSONAL' ? hasGoogle : hasGoogle && searchParams.get('includeAll') === 'true';
    const wantOutlook = mode === 'WORK' ? hasMicrosoft : hasMicrosoft && searchParams.get('includeAll') === 'true';

    const [googleEvents, outlookEvents] = await Promise.all([
      wantGoogle ? listGoogleEvents(userId, from, to) : Promise.resolve([]),
      wantOutlook ? listOutlookEvents(userId, from, to) : Promise.resolve([]),
    ]);

    return NextResponse.json({ events: [...googleEvents, ...outlookEvents] });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}

const createSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  title: z.string().min(1).max(300),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createSchema.parse(await req.json());

    const id =
      body.provider === 'google'
        ? await createGoogleEvent(userId, { ...body, allDay: body.allDay ?? false })
        : await createOutlookEvent(userId, { ...body, allDay: body.allDay ?? false });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
