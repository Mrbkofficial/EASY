import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';
import { encryptSecret } from '@/lib/encryption';
import { verifyAppleMailCredentials } from '@/lib/appleMail';

const schema = z.object({
  email: z.string().email(),
  appPassword: z
    .string()
    .min(16)
    .max(19)
    .regex(/^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$/i, 'App-specific passwords look like xxxx-xxxx-xxxx-xxxx'),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await req.json());

    try {
      await verifyAppleMailCredentials(body.email, body.appPassword);
    } catch {
      return NextResponse.json(
        { error: 'Could not sign in to iCloud Mail with those credentials. Double-check the email and app-specific password.' },
        { status: 400 }
      );
    }

    const account = await prisma.appleMailAccount.upsert({
      where: { userId_email: { userId, email: body.email } },
      update: { encryptedAppPassword: encryptSecret(body.appPassword) },
      create: { userId, email: body.email, encryptedAppPassword: encryptSecret(body.appPassword) },
    });

    return NextResponse.json({ id: account.id, email: account.email });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to connect Apple Mail' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    await prisma.appleMailAccount.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
