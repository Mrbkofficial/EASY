import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';

const schema = z.object({ provider: z.enum(['google', 'azure-ad']) });

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { provider } = schema.parse(await req.json());
    await prisma.account.deleteMany({ where: { userId, provider } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
