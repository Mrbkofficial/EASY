import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';
import type { Recurrence } from '@prisma/client';

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  notes: z.string().max(5000).nullable().optional(),
  mode: z.enum(['PERSONAL', 'WORK']).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  category: z.string().max(60).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  reminderOffsets: z.array(z.number().int().min(0)).optional(),
});

function nextOccurrence(date: Date, recurrence: Recurrence): Date {
  const d = new Date(date);
  switch (recurrence) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ task });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to load task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = updateSchema.parse(await req.json());
    const becomingCompleted = body.completed === true && !existing.completed;

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...body,
        dueAt: body.dueAt === undefined ? undefined : body.dueAt ? new Date(body.dueAt) : null,
        completedAt: body.completed === undefined ? undefined : body.completed ? new Date() : null,
      },
    });

    // Auto-create the next occurrence for recurring tasks when marked complete.
    if (becomingCompleted && existing.recurrence !== 'NONE' && existing.dueAt) {
      await prisma.task.create({
        data: {
          userId,
          title: existing.title,
          notes: existing.notes,
          mode: existing.mode,
          dueAt: nextOccurrence(existing.dueAt, existing.recurrence),
          allDay: existing.allDay,
          priority: existing.priority,
          category: existing.category,
          color: existing.color,
          recurrence: existing.recurrence,
          reminderOffsets: existing.reminderOffsets,
        },
      });
    }

    return NextResponse.json({ task });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
