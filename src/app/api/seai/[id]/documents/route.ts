import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

const schema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().url(),
  kind: z.string().max(30).default('photo'),
});

export function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const project = await prisma.seaiProject.findFirst({ where: { id: params.id, userId } });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = schema.parse(await req.json());
    const document = await prisma.seaiDocument.create({
      data: { projectId: params.id, label: body.label, url: body.url, kind: body.kind },
    });
    return NextResponse.json({ document }, { status: 201 });
  });
}

export function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const docId = new URL(req.url).searchParams.get('docId');
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });
    const project = await prisma.seaiProject.findFirst({ where: { id: params.id, userId } });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.seaiDocument.deleteMany({ where: { id: docId, projectId: params.id } });
    return NextResponse.json({ ok: true });
  });
}
