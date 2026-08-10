import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin()) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  await prisma.order.update({
    where: { id: params.id },
    data: { status: 'FULFILLED', fulfilled: true, fulfilledAt: new Date() },
  });

  return NextResponse.redirect(new URL(`/admin/orders/${params.id}`, req.url));
}
