import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

const updateSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  address: z.string().max(400).nullable().optional(),
  eircode: z.string().max(20).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, userId },
      include: {
        jobs: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        quotes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ customer });
  });
}

export function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const body = updateSchema.parse(await req.json());
    const existing = await prisma.customer.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v === '' ? null : v]));
    const customer = await prisma.customer.update({ where: { id: params.id }, data });
    return NextResponse.json({ customer });
  });
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const existing = await prisma.customer.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.customer.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
