import { prisma } from '@/lib/prisma';

// Atomically allocate the next quote/invoice number for a user, e.g. "INV-0007".
// Uses a transaction so concurrent creates never collide on a sequence value.
export async function nextDocumentNumber(
  userId: string,
  kind: 'quote' | 'invoice'
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        quotePrefix: true,
        invoicePrefix: true,
        nextQuoteSeq: true,
        nextInvoiceSeq: true,
      },
    });

    if (kind === 'quote') {
      const seq = user.nextQuoteSeq;
      await tx.user.update({ where: { id: userId }, data: { nextQuoteSeq: seq + 1 } });
      return `${user.quotePrefix}-${String(seq).padStart(4, '0')}`;
    }

    const seq = user.nextInvoiceSeq;
    await tx.user.update({ where: { id: userId }, data: { nextInvoiceSeq: seq + 1 } });
    return `${user.invoicePrefix}-${String(seq).padStart(4, '0')}`;
  });
}
