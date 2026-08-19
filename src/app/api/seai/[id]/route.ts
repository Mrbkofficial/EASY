import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

const checklistItem = z.object({ key: z.string(), label: z.string(), done: z.boolean() });

const updateSchema = z.object({
  applicationRef: z.string().max(120).nullable().optional(),
  berBefore: z.string().max(20).nullable().optional(),
  berAfter: z.string().max(20).nullable().optional(),
  grantAmount: z.number().min(0).nullable().optional(),
  submitted: z.boolean().optional(),
  approved: z.boolean().optional(),
  notes: z.string().max(4000).nullable().optional(),
  checklist: z.array(checklistItem).optional(),
});

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const project = await prisma.seaiProject.findFirst({
      where: { id: params.id, userId },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        job: { include: { customer: true } },
      },
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ project });
  });
}

export function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const body = updateSchema.parse(await req.json());
    const existing = await prisma.seaiProject.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const project = await prisma.seaiProject.update({
      where: { id: params.id },
      data: {
        ...body,
        checklist: body.checklist ? (body.checklist as unknown as Prisma.InputJsonValue) : undefined,
      },
      include: { documents: { orderBy: { createdAt: 'desc' } } },
    });
    return NextResponse.json({ project });
  });
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const existing = await prisma.seaiProject.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.seaiProject.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
