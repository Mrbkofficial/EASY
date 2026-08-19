import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

const TRADES = ['PLUMBING', 'ELECTRICAL', 'INSULATION', 'HEATING', 'CARPENTRY', 'ROOFING', 'GENERAL', 'OTHER'] as const;
const STATUSES = ['LEAD', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'CANCELLED'] as const;

const updateSchema = z.object({
  customerId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  trade: z.enum(TRADES).optional(),
  status: z.enum(STATUSES).optional(),
  description: z.string().max(4000).nullable().optional(),
  address: z.string().max(400).nullable().optional(),
  eircode: z.string().max(20).nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const job = await prisma.job.findFirst({
      where: { id: params.id, userId },
      include: {
        customer: true,
        quotes: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        seaiProject: { include: { documents: { orderBy: { createdAt: 'desc' } } } },
      },
    });
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ job });
  });
}

export function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const body = updateSchema.parse(await req.json());
    const existing = await prisma.job.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...body,
        scheduledFor:
          body.scheduledFor === undefined
            ? undefined
            : body.scheduledFor
            ? new Date(body.scheduledFor)
            : null,
      },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
    return NextResponse.json({ job });
  });
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const existing = await prisma.job.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
