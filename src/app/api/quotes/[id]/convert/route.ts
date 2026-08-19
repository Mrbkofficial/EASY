import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';
import { nextDocumentNumber } from '@/lib/numbering';
import { randomToken } from '@/lib/utils';

// Convert an accepted quote into a draft invoice, copying line items across.
export function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const quote = await prisma.quote.findFirst({
      where: { id: params.id, userId },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const number = await nextDocumentNumber(userId, 'invoice');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { invoiceTerms: true },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        customerId: quote.customerId,
        jobId: quote.jobId,
        quoteId: quote.id,
        number,
        shareToken: randomToken(),
        dueDate,
        notes: quote.notes,
        terms: user?.invoiceTerms ?? quote.terms,
        subtotal: quote.subtotal,
        vatTotal: quote.vatTotal,
        total: quote.total,
        items: {
          create: quote.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            vatRate: it.vatRate,
            position: it.position,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    // Mark the quote accepted and advance the job to invoiced.
    await prisma.quote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED' } });
    if (quote.jobId) {
      await prisma.job.update({ where: { id: quote.jobId }, data: { status: 'INVOICED' } });
    }

    return NextResponse.json({ invoice }, { status: 201 });
  });
}
