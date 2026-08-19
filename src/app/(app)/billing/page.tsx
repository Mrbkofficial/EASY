'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FileText, ReceiptEuro, ChevronRight } from 'lucide-react';
import { useQuotes, useInvoices } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { PageHeader, EmptyState, Spinner, Fab, StatusBadge } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { NewDocumentModal } from '@/components/forms/NewDocumentModal';
import { QUOTE_STATUS, INVOICE_STATUS } from '@/lib/trades';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

function BillingInner() {
  const params = useSearchParams();
  const initialTab = params.get('tab') === 'invoices' ? 'invoices' : 'quotes';
  const [tab, setTab] = useState<'quotes' | 'invoices'>(initialTab);
  const [newOpen, setNewOpen] = useState(false);

  const { quotes, isLoading: qLoading } = useQuotes();
  const { invoices, isLoading: iLoading } = useInvoices();

  return (
    <div>
      <PageHeader title="Billing" subtitle="Quotes & invoices" />

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-base-surface2 p-1">
        {(['quotes', 'invoices'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg py-2 text-sm font-medium capitalize transition',
              tab === t ? 'bg-base-surface text-base-text shadow-card' : 'text-base-muted'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'quotes' ? (
        qLoading ? (
          <Spinner />
        ) : quotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotes yet"
            description="Create a quote, then send it to your customer over WhatsApp in one tap."
            action={<Button onClick={() => setNewOpen(true)}>New quote</Button>}
          />
        ) : (
          <Card className="divide-y divide-base-border">
            {quotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
                <FileText size={15} className="shrink-0 text-base-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {q.number} · {q.customer?.name}
                  </p>
                  <p className="text-xs text-base-muted">{formatDate(q.issueDate)}</p>
                </div>
                <span className="text-sm font-medium">{formatCurrency(q.total)}</span>
                <StatusBadge {...QUOTE_STATUS[q.status]} />
                <ChevronRight size={16} className="text-base-muted" />
              </Link>
            ))}
          </Card>
        )
      ) : iLoading ? (
        <Spinner />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={ReceiptEuro}
          title="No invoices yet"
          description="Turn an accepted quote into an invoice, or create one from scratch."
          action={<Button onClick={() => setNewOpen(true)}>New invoice</Button>}
        />
      ) : (
        <Card className="divide-y divide-base-border">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
              <ReceiptEuro size={15} className="shrink-0 text-base-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {inv.number} · {inv.customer?.name}
                </p>
                <p className="text-xs text-base-muted">
                  {inv.dueDate ? `Due ${formatDate(inv.dueDate)}` : formatDate(inv.issueDate)}
                </p>
              </div>
              <span className="text-sm font-medium">{formatCurrency(inv.total)}</span>
              <StatusBadge {...INVOICE_STATUS[inv.status]} />
              <ChevronRight size={16} className="text-base-muted" />
            </Link>
          ))}
        </Card>
      )}

      <Fab label={tab === 'quotes' ? 'Quote' : 'Invoice'} onClick={() => setNewOpen(true)} />
      <NewDocumentModal open={newOpen} onClose={() => setNewOpen(false)} kind={tab === 'quotes' ? 'quote' : 'invoice'} />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <BillingInner />
    </Suspense>
  );
}
