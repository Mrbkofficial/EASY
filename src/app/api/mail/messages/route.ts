import { NextRequest, NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/session';
import { listGmailMessages } from '@/lib/gmail';
import { listOutlookMessages } from '@/lib/outlook';
import { listAppleMail } from '@/lib/appleMail';
import { isGoogleConnected } from '@/lib/google';
import { isMicrosoftConnected } from '@/lib/graph';
import { isAppleMailConnected } from '@/lib/appleMail';
import type { UnifiedMessage } from '@/types';

// Personal mode: Gmail + Apple Mail. Work mode: Outlook.
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') ?? 'PERSONAL';

    const [hasGoogle, hasMicrosoft, hasApple] = await Promise.all([
      isGoogleConnected(userId),
      isMicrosoftConnected(userId),
      isAppleMailConnected(userId),
    ]);

    const tasks: Promise<UnifiedMessage[]>[] = [];
    if (mode === 'PERSONAL') {
      if (hasGoogle) tasks.push(listGmailMessages(userId));
      if (hasApple) tasks.push(listAppleMail(userId));
    } else {
      if (hasMicrosoft) tasks.push(listOutlookMessages(userId));
    }

    const results = await Promise.allSettled(tasks);
    const messages = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    messages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ messages });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to load mail' }, { status: 500 });
  }
}
