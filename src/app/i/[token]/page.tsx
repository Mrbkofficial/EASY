import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { DocumentView } from '@/components/DocumentView';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Invoice', robots: { index: false } };

export default async function PublicInvoicePage({ params }: { params: { token: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { shareToken: params.token },
    include: { items: { orderBy: { position: 'asc' } }, customer: true, user: true },
  });
  if (!invoice) notFound();

  return (
    <div className="min-h-dvh bg-zinc-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between print:hidden">
        <span className="text-sm font-medium text-zinc-500">Invoice {invoice.number}</span>
        <PrintButton />
      </div>
      <DocumentView
        data={{
          kind: 'invoice',
          number: invoice.number,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status,
          items: invoice.items,
          notes: invoice.notes,
          terms: invoice.terms,
          business: invoice.user,
          customer: invoice.customer,
        }}
      />
      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-zinc-400 print:hidden">Powered by TradeMate</p>
    </div>
  );
}
