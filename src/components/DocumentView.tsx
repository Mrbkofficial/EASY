import { formatEUR, computeTotals } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import type { LineItem } from '@/types';

export interface DocumentData {
  kind: 'quote' | 'invoice';
  number: string;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  validUntil?: string | Date | null;
  status?: string;
  items: LineItem[];
  notes?: string | null;
  terms?: string | null;
  business: {
    businessName?: string | null;
    name?: string | null;
    businessEmail?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    eircode?: string | null;
    vatNumber?: string | null;
    logoUrl?: string | null;
    bankDetails?: string | null;
  };
  customer: {
    name: string;
    address?: string | null;
    eircode?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

// Print-friendly quote/invoice document. Pure presentational — safe in server
// components and on public share pages.
export function DocumentView({ data }: { data: DocumentData }) {
  const totals = computeTotals(data.items);
  const isInvoice = data.kind === 'invoice';
  const bizName = data.business.businessName || data.business.name || 'Your Business';

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-base-border bg-white p-6 text-zinc-900 shadow-card sm:p-8 print:border-0 print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {data.business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.business.logoUrl} alt={bizName} className="mb-2 h-12 w-auto object-contain" />
          ) : (
            <h1 className="text-xl font-bold">{bizName}</h1>
          )}
          <div className="mt-1 text-xs text-zinc-500">
            {data.business.address && <p>{data.business.address}</p>}
            {data.business.eircode && <p>{data.business.eircode}</p>}
            {data.business.phone && <p>{data.business.phone}</p>}
            {(data.business.businessEmail || data.business.email) && (
              <p>{data.business.businessEmail || data.business.email}</p>
            )}
            {data.business.vatNumber && <p>VAT No: {data.business.vatNumber}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold uppercase tracking-wide text-teal-600">
            {isInvoice ? 'Invoice' : 'Quotation'}
          </p>
          <p className="text-sm font-medium">{data.number}</p>
          <p className="mt-1 text-xs text-zinc-500">Date: {formatDate(data.issueDate)}</p>
          {isInvoice && data.dueDate && (
            <p className="text-xs text-zinc-500">Due: {formatDate(data.dueDate)}</p>
          )}
          {!isInvoice && data.validUntil && (
            <p className="text-xs text-zinc-500">Valid until: {formatDate(data.validUntil)}</p>
          )}
        </div>
      </div>

      {/* Bill to */}
      <div className="mt-6 border-t border-zinc-100 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {isInvoice ? 'Invoice to' : 'Prepared for'}
        </p>
        <p className="mt-1 font-medium">{data.customer.name}</p>
        <div className="text-xs text-zinc-500">
          {data.customer.address && <span>{data.customer.address} </span>}
          {data.customer.eircode && <span>{data.customer.eircode}</span>}
        </div>
      </div>

      {/* Items */}
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wide text-zinc-400">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 text-right font-medium">Qty</th>
            <th className="pb-2 text-right font-medium">Unit</th>
            <th className="pb-2 text-right font-medium">VAT</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i} className="border-b border-zinc-100 align-top">
              <td className="py-2 pr-2">{it.description}</td>
              <td className="py-2 text-right tabular-nums">{it.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatEUR(it.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums text-zinc-500">{it.vatRate}%</td>
              <td className="py-2 text-right tabular-nums">{formatEUR(it.quantity * it.unitPrice)}</td>
            </tr>
          ))}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-zinc-400">
                No line items
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[240px] space-y-1 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatEUR(totals.subtotal)}</span>
          </div>
          {totals.vatByRate
            .filter((v) => v.vat > 0)
            .map((v) => (
              <div key={v.rate} className="flex justify-between text-zinc-500">
                <span>VAT @ {v.rate}%</span>
                <span className="tabular-nums">{formatEUR(v.vat)}</span>
              </div>
            ))}
          <div className="flex justify-between border-t border-zinc-200 pt-1 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums text-teal-600">{formatEUR(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes / terms / bank */}
      {(data.notes || data.terms || (isInvoice && data.business.bankDetails)) && (
        <div className="mt-6 space-y-3 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
          {data.notes && (
            <div>
              <p className="font-semibold text-zinc-600">Notes</p>
              <p className="whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
          {isInvoice && data.business.bankDetails && (
            <div>
              <p className="font-semibold text-zinc-600">Payment details</p>
              <p className="whitespace-pre-wrap">{data.business.bankDetails}</p>
            </div>
          )}
          {data.terms && (
            <div>
              <p className="font-semibold text-zinc-600">Terms</p>
              <p className="whitespace-pre-wrap">{data.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
