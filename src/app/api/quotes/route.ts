import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';
import { computeTotals } from '@/lib/money';
import { nextDocumentNumber } from '@/lib/numbering';
import { randomToken } from '@/lib/utils';

const itemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(100),
});

const createSchema = z.object({
  customerId: z.string().min(1),
  jobId: z.string().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  terms: z.string().max(4000).nullable().optional(),
  items: z.array(itemSchema).default([]),
});

export function GET(req: NextRequest) {
  return withUser(async (userId) => {
    const status = new URL(req.url).searchParams.get('status');
    const quotes = await prisma.quote.findMany({
      where: { userId, ...(status ? { status: status as never } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
    return NextResponse.json({ quotes });
  });
}

export function POST(req: NextRequest) {
  return withUser(async (userId) => {
    const body = createSchema.parse(await req.json());
    const customer = await prisma.customer.findFirst({ where: { id: body.customerId, userId } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const totals = computeTotals(body.items);
    const number = await nextDocumentNumber(userId, 'quote');
    const businessTerms = await prisma.user.findUnique({
      where: { id: userId },
      select: { quoteTerms: true },
    });

    const quote = await prisma.quote.create({
      data: {
        userId,
        customerId: body.customerId,
        jobId: body.jobId || null,
        number,
        shareToken: randomToken(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        notes: body.notes || null,
        terms: body.terms ?? businessTerms?.quoteTerms ?? null,
        subtotal: totals.subtotal,
        vatTotal: totals.vatTotal,
        total: totals.total,
        items: {
          create: body.items.map((it, i) => ({ ...it, position: i })),
        },
      },
      include: { items: true, customer: true },
    });
    return NextResponse.json({ quote }, { status: 201 });
  });
}
