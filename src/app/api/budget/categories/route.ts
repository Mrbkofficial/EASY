import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, AuthError } from '@/lib/session';

const createSchema = z.object({
  mode: z.enum(['PERSONAL', 'WORK']).default('PERSONAL'),
  name: z.string().min(1).max(60),
  color: z.string().default('#6366f1'),
  monthlyLimit: z.number().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const categories = await prisma.budgetCategory.findMany({
      where: { userId, ...(mode ? { mode: mode as 'PERSONAL' | 'WORK' } : {}) },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({
      categories: categories.map((c) => ({ ...c, monthlyLimit: c.monthlyLimit ? Number(c.monthlyLimit) : null })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = createSchema.parse(await req.json());
    const category = await prisma.budgetCategory.create({ data: { userId, ...body } });
    return NextResponse.json(
      { category: { ...category, monthlyLimit: category.monthlyLimit ? Number(category.monthlyLimit) : null } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
