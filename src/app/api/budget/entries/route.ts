import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';

const createSchema = z.object({
  mode: z.enum(['PERSONAL', 'WORK']).default('PERSONAL'),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  merchant: z.string().max(200).optional(),
  note: z.string().max(2000).optional(),
  date: z.string().datetime().optional(),
  categoryId: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  source: z.enum(['manual', 'receipt']).default('manual'),
});

function serialize(entry: { amount: unknown; [k: string]: unknown }) {
  return { ...entry, amount: Number(entry.amount) };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const entries = await prisma.budgetEntry.findMany({
      where: {
        userId,
        ...(mode ? { mode: mode as 'PERSONAL' | 'WORK' } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ entries: entries.map(serialize) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createSchema.parse(await req.json());

    const entry = await prisma.budgetEntry.create({
      data: {
        userId,
        mode: body.mode,
        amount: body.amount,
        currency: body.currency,
        merchant: body.merchant,
        note: body.note,
        date: body.date ? new Date(body.date) : new Date(),
        categoryId: body.categoryId,
        receiptUrl: body.receiptUrl,
        source: body.source,
      },
      include: { category: true },
    });

    return NextResponse.json({ entry: serialize(entry) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
