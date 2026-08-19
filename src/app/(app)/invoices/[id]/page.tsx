'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { useInvoice, useBusiness } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field, Spinner } from '@/components/ui/Bits';
import { LineItemsEditor } from '@/components/LineItemsEditor';
import { ShareActions } from '@/components/ShareActions';
import { apiPatch, apiDelete } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { INVOICE_STATUS } from '@/lib/trades';
import type { LineItem } from '@/types';

function toDateInput(v?: string | null) {
  return v ? new Date(v).toISOString().slice(0, 10) : '';
}

export default function InvoiceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { invoice, isLoading, mutate } = useInvoice(id);
  const { business } = useBusiness();

  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (invoice && !hydrated) {
      setItems(invoice.items?.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, vatRate: i.vatRate })) ?? []);
      setNotes(invoice.notes ?? '');
      setDueDate(toDateInput(invoice.dueDate));
      setStatus(invoice.status);
      setHydrated(true);
    }
  }, [invoice, hydrated]);

  if (isLoading || !invoice) return <Spinner />;

  async function save(extra?: Record<string, unknown>) {
    setSaving(true);
    try {
      await apiPatch(`/api/invoices/${id}`, {
        items,
        notes,
        status,
        dueDate: dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : null,
        ...extra,
      });
      await mutate();
      toast('Invoice saved', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function markPaid() {
    setStatus('PAID');
    await save({ status: 'PAID' });
  }

  async function remove() {
    if (!confirm('Delete this invoice?')) return;
    try {
      await apiDelete(`/api/invoices/${id}`);
      toast('Invoice deleted', 'success');
      router.push('/billing?tab=invoices');
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  return (
    <div>
      <Link href="/billing?tab=invoices" className="mb-3 inline-flex items-center gap-1 text-sm text-base-muted">
        <ArrowLeft size={16} /> Invoices
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{invoice.number}</h1>
          <p className="text-sm text-base-muted">{invoice.customer?.name}</p>
        </div>
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(INVOICE_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-semibold text-base-muted">Send to customer</p>
        <ShareActions
          kind="invoice"
          number={invoice.number}
          total={invoice.total}
          shareToken={invoice.shareToken}
          customerName={invoice.customer?.name ?? 'there'}
          customerPhone={invoice.customer?.phone}
          businessName={business?.businessName}
          dueDate={invoice.dueDate}
        />
        <p className="mt-2 text-center text-[11px] text-base-muted">Save your latest changes before sharing.</p>
      </div>

      <Card className="mb-4 p-4">
        <LineItemsEditor items={items} onChange={setItems} defaultVatRate={business?.defaultVatRate ?? 13.5} />
      </Card>

      <div className="mb-4 space-y-3">
        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Notes (shown on invoice)">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra info…" />
        </Field>
        {!business?.bankDetails && (
          <p className="rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
            Add your bank / payment details in Settings so customers know how to pay.
          </p>
        )}
      </div>

      <div className="sticky bottom-24 z-10 flex gap-2 sm:bottom-4">
        <Button className="flex-1" onClick={() => save()} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save invoice
        </Button>
        {invoice.status !== 'PAID' && (
          <Button variant="outline" onClick={markPaid} disabled={saving}>
            <CheckCircle2 size={16} /> Mark paid
          </Button>
        )}
      </div>

      <button onClick={remove} className="mt-6 flex items-center gap-2 text-sm text-danger">
        <Trash2 size={15} /> Delete invoice
      </button>
    </div>
  );
}
