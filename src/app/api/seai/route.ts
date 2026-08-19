import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';
import { defaultChecklistFor } from '@/lib/trades';

const GRANTS = [
  'ATTIC_INSULATION', 'CAVITY_WALL_INSULATION', 'INTERNAL_WALL_INSULATION',
  'EXTERNAL_WALL_INSULATION', 'HEAT_PUMP', 'SOLAR_PV', 'HEATING_CONTROLS',
  'WINDOWS_DOORS', 'OTHER',
] as const;

const createSchema = z.object({
  jobId: z.string().min(1),
  grantType: z.enum(GRANTS),
});

export function GET() {
  return withUser(async (userId) => {
    const projects = await prisma.seaiProject.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        job: { include: { customer: { select: { name: true } } } },
        _count: { select: { documents: true } },
      },
    });
    return NextResponse.json({ projects });
  });
}

export function POST(req: NextRequest) {
  return withUser(async (userId) => {
    const body = createSchema.parse(await req.json());
    const job = await prisma.job.findFirst({ where: { id: body.jobId, userId } });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const existing = await prisma.seaiProject.findUnique({ where: { jobId: body.jobId } });
    if (existing) return NextResponse.json({ error: 'This job already has a SEAI project' }, { status: 409 });

    const project = await prisma.seaiProject.create({
      data: {
        userId,
        jobId: body.jobId,
        grantType: body.grantType,
        checklist: defaultChecklistFor(body.grantType) as unknown as Prisma.InputJsonValue,
      },
      include: { documents: true },
    });
    return NextResponse.json({ project }, { status: 201 });
  });
}
