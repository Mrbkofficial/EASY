import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

const TRADES = ['PLUMBING', 'ELECTRICAL', 'INSULATION', 'HEATING', 'CARPENTRY', 'ROOFING', 'GENERAL', 'OTHER'] as const;
const STATUSES = ['LEAD', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'CANCELLED'] as const;

const createSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1).max(200),
  trade: z.enum(TRADES).default('GENERAL'),
  status: z.enum(STATUSES).optional(),
  description: z.string().max(4000).nullable().optional(),
  address: z.string().max(400).nullable().optional(),
  eircode: z.string().max(20).nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export function GET(req: NextRequest) {
  return withUser(async (userId) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const jobs = await prisma.job.findMany({
      where: {
        userId,
        ...(status ? { status: status as (typeof STATUSES)[number] } : {}),
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
    return NextResponse.json({ jobs });
  });
}

export function POST(req: NextRequest) {
  return withUser(async (userId) => {
    const body = createSchema.parse(await req.json());
    // Guard against creating a job for someone else's customer.
    const customer = await prisma.customer.findFirst({ where: { id: body.customerId, userId } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const job = await prisma.job.create({
      data: {
        userId,
        customerId: body.customerId,
        title: body.title,
        trade: body.trade,
        status: body.status ?? 'LEAD',
        description: body.description || null,
        address: body.address || null,
        eircode: body.eircode || null,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        notes: body.notes || null,
      },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
    return NextResponse.json({ job }, { status: 201 });
  });
}
