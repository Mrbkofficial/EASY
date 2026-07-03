import { NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/session';
import { isGoogleConnected } from '@/lib/google';
import { isMicrosoftConnected } from '@/lib/graph';
import { isAppleMailConnected } from '@/lib/appleMail';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await requireUserId();
    const [google, microsoft, apple, appleAccount] = await Promise.all([
      isGoogleConnected(userId),
      isMicrosoftConnected(userId),
      isAppleMailConnected(userId),
      prisma.appleMailAccount.findFirst({ where: { userId }, select: { email: true } }),
    ]);
    return NextResponse.json({ google, microsoft, apple, appleEmail: appleAccount?.email ?? null });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to load connections' }, { status: 500 });
  }
}
