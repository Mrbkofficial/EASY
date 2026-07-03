import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId, AuthError } from '@/lib/session';
import { sendGmailMessage } from '@/lib/gmail';
import { sendOutlookMessage } from '@/lib/outlook';
import { sendAppleMail } from '@/lib/appleMail';

const schema = z.object({
  provider: z.enum(['google', 'outlook', 'apple']),
  to: z.string().email(),
  subject: z.string().min(1).max(300),
  text: z.string().min(1).max(20000),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await req.json());

    if (body.provider === 'google') {
      await sendGmailMessage(userId, body);
    } else if (body.provider === 'outlook') {
      await sendOutlookMessage(userId, body);
    } else {
      await sendAppleMail(userId, body);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
