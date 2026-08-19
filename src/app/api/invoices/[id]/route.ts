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
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  jobId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  paidDate: z.string().datetime().nullable().optional(),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().max(4000).nullable().optional(),
  terms: z.string().max(4000).nullable().optional(),
  items: z.array(itemSchema).optional(),
});

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: { items: { orderBy: { position: 'asc' } }, customer: true, job: true },
    });
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ invoice });
  });
}

export function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const body = updateSchema.parse(await req.json());
    const existing = await prisma.invoice.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const totals = body.items ? computeTotals(body.items) : null;

    // When marking paid, default paidDate + amountPaid for convenience.
    const markingPaid = body.status === 'PAID';

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: body.status,
        jobId: body.jobId === undefined ? undefined : body.jobId || null,
        dueDate: body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null,
        paidDate:
          body.paidDate !== undefined
            ? body.paidDate
              ? new Date(body.paidDate)
              : null
            : markingPaid
            ? new Date()
            : undefined,
        amountPaid:
          body.amountPaid !== undefined
            ? body.amountPaid
            : markingPaid
            ? totals?.total ?? existing.total
            : undefined,
        notes: body.notes,
        terms: body.terms,
        ...(totals
          ? {
              subtotal: totals.subtotal,
              vatTotal: totals.vatTotal,
              total: totals.total,
              items: { deleteMany: {}, create: body.items!.map((it, i) => ({ ...it, position: i })) },
            }
          : {}),
      },
      include: { items: { orderBy: { position: 'asc' } }, customer: true },
    });
    return NextResponse.json({ invoice });
  });
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const existing = await prisma.invoice.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.invoice.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
