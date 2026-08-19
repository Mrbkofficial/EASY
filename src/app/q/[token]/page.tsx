import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { DocumentView } from '@/components/DocumentView';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Quotation', robots: { index: false } };

export default async function PublicQuotePage({ params }: { params: { token: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { shareToken: params.token },
    include: { items: { orderBy: { position: 'asc' } }, customer: true, user: true },
  });
  if (!quote) notFound();

  return (
    <div className="min-h-dvh bg-zinc-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between print:hidden">
        <span className="text-sm font-medium text-zinc-500">Quotation {quote.number}</span>
        <PrintButton />
      </div>
      <DocumentView
        data={{
          kind: 'quote',
          number: quote.number,
          issueDate: quote.issueDate,
          validUntil: quote.validUntil,
          status: quote.status,
          items: quote.items,
          notes: quote.notes,
          terms: quote.terms,
          business: quote.user,
          customer: quote.customer,
        }}
      />
      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-zinc-400 print:hidden">
        Powered by TradeMate
      </p>
    </div>
  );
}
