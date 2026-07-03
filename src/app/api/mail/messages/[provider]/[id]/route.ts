import { NextRequest, NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/session';
import { getGmailMessage } from '@/lib/gmail';
import { getOutlookMessage } from '@/lib/outlook';
import { getAppleMailMessage } from '@/lib/appleMail';

type Params = { params: { provider: 'google' | 'outlook' | 'apple'; id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    let message;
    if (params.provider === 'google') message = await getGmailMessage(userId, params.id);
    else if (params.provider === 'outlook') message = await getOutlookMessage(userId, params.id);
    else message = await getAppleMailMessage(userId, params.id);

    if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to load message' }, { status: 500 });
  }
}
