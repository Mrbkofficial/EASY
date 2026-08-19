import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

const createSchema = z.object({
  name: z.string().min(1).max(160),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(400).optional().nullable(),
  eircode: z.string().max(20).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

export function GET(req: NextRequest) {
  return withUser(async (userId) => {
    const q = new URL(req.url).searchParams.get('q')?.trim();
    const customers = await prisma.customer.findMany({
      where: {
        userId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { email: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { jobs: true, invoices: true } } },
    });
    return NextResponse.json({ customers });
  });
}

export function POST(req: NextRequest) {
  return withUser(async (userId) => {
    const body = createSchema.parse(await req.json());
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        eircode: body.eircode || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({ customer }, { status: 201 });
  });
}
