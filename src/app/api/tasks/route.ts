import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';

const createSchema = z.object({
  title: z.string().min(1).max(300),
  notes: z.string().max(5000).optional(),
  mode: z.enum(['PERSONAL', 'WORK']).default('PERSONAL'),
  dueAt: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  category: z.string().max(60).optional(),
  color: z.string().max(20).optional(),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  reminderOffsets: z.array(z.number().int().min(0)).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const completed = searchParams.get('completed');

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(mode ? { mode: mode as 'PERSONAL' | 'WORK' } : {}),
        ...(completed !== null ? { completed: completed === 'true' } : {}),
        ...(from || to
          ? {
              dueAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ completed: 'asc' }, { dueAt: 'asc' }],
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createSchema.parse(await req.json());

    const task = await prisma.task.create({
      data: {
        userId,
        title: body.title,
        notes: body.notes,
        mode: body.mode,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        allDay: body.allDay ?? false,
        priority: body.priority ?? 'MEDIUM',
        category: body.category,
        color: body.color,
        recurrence: body.recurrence ?? 'NONE',
        reminderOffsets: body.reminderOffsets ?? [],
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
