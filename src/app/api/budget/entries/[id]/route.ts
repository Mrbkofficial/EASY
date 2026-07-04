import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  merchant: z.string().max(200).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  date: z.string().datetime().optional(),
  categoryId: z.string().nullable().optional(),
});

function serialize(entry: { amount: unknown; [k: string]: unknown }) {
  return { ...entry, amount: Number(entry.amount) };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.budgetEntry.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = updateSchema.parse(await req.json());
    const entry = await prisma.budgetEntry.update({
      where: { id: params.id },
      data: { ...body, date: body.date ? new Date(body.date) : undefined },
      include: { category: true },
    });

    return NextResponse.json({ entry: serialize(entry) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.budgetEntry.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.budgetEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
