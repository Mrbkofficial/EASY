import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';
import { computeTotals } from '@/lib/money';

const itemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(100),
});

const updateSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED']).optional(),
  jobId: z.string().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  terms: z.string().max(4000).nullable().optional(),
  items: z.array(itemSchema).optional(),
});

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const quote = await prisma.quote.findFirst({
      where: { id: params.id, userId },
      include: { items: { orderBy: { position: 'asc' } }, customer: true, job: true },
    });
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ quote });
  });
}

export function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const body = updateSchema.parse(await req.json());
    const existing = await prisma.quote.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const totals = body.items ? computeTotals(body.items) : null;

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        status: body.status,
        jobId: body.jobId === undefined ? undefined : body.jobId || null,
        validUntil:
          body.validUntil === undefined ? undefined : body.validUntil ? new Date(body.validUntil) : null,
        notes: body.notes,
        terms: body.terms,
        ...(totals
          ? {
              subtotal: totals.subtotal,
              vatTotal: totals.vatTotal,
              total: totals.total,
              items: {
                deleteMany: {},
                create: body.items!.map((it, i) => ({ ...it, position: i })),
              },
            }
          : {}),
      },
      include: { items: { orderBy: { position: 'asc' } }, customer: true },
    });
    return NextResponse.json({ quote });
  });
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const existing = await prisma.quote.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.quote.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
