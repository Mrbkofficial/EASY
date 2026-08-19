'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2, FileUp } from 'lucide-react';
import { useQuote, useBusiness } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field, Spinner } from '@/components/ui/Bits';
import { LineItemsEditor } from '@/components/LineItemsEditor';
import { ShareActions } from '@/components/ShareActions';
import { apiPatch, apiPost, apiDelete } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { QUOTE_STATUS } from '@/lib/trades';
import type { LineItem } from '@/types';

function toDateInput(v?: string | null) {
  return v ? new Date(v).toISOString().slice(0, 10) : '';
}

export default function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { quote, isLoading, mutate } = useQuote(id);
  const { business } = useBusiness();

  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (quote && !hydrated) {
      setItems(quote.items?.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, vatRate: i.vatRate })) ?? []);
      setNotes(quote.notes ?? '');
      setValidUntil(toDateInput(quote.validUntil));
      setStatus(quote.status);
      setHydrated(true);
    }
  }, [quote, hydrated]);

  if (isLoading || !quote) return <Spinner />;

  async function save(extra?: Record<string, unknown>) {
    setSaving(true);
    try {
      await apiPatch(`/api/quotes/${id}`, {
        items,
        notes,
        status,
        validUntil: validUntil ? new Date(validUntil + 'T00:00:00').toISOString() : null,
        ...extra,
      });
      await mutate();
      toast('Quote saved', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function convert() {
    if (items.length === 0) return toast('Add line items first', 'error');
    if (!confirm('Create an invoice from this quote?')) return;
    setSaving(true);
    try {
      await save();
      const res = await apiPost<{ invoice: { id: string } }>(`/api/quotes/${id}/convert`, {});
      toast('Invoice created', 'success');
      router.push(`/invoices/${res.invoice.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to convert', 'error');
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this quote?')) return;
    try {
      await apiDelete(`/api/quotes/${id}`);
      toast('Quote deleted', 'success');
      router.push('/billing?tab=quotes');
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  return (
    <div>
      <Link href="/billing?tab=quotes" className="mb-3 inline-flex items-center gap-1 text-sm text-base-muted">
        <ArrowLeft size={16} /> Quotes
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{quote.number}</h1>
          <p className="text-sm text-base-muted">{quote.customer?.name}</p>
        </div>
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(QUOTE_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Share */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-semibold text-base-muted">Send to customer</p>
        <ShareActions
          kind="quote"
          number={quote.number}
          total={quote.total}
          shareToken={quote.shareToken}
          customerName={quote.customer?.name ?? 'there'}
          customerPhone={quote.customer?.phone}
          businessName={business?.businessName}
        />
        <p className="mt-2 text-center text-[11px] text-base-muted">Save your latest changes before sharing.</p>
      </div>

      <Card className="mb-4 p-4">
        <LineItemsEditor items={items} onChange={setItems} defaultVatRate={business?.defaultVatRate ?? 13.5} />
      </Card>

      <div className="mb-4 space-y-3">
        <Field label="Valid until">
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </Field>
        <Field label="Notes (shown on quote)">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra info for the customer…" />
        </Field>
      </div>

      <div className="sticky bottom-24 z-10 flex gap-2 sm:bottom-4">
        <Button className="flex-1" onClick={() => save()} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save quote
        </Button>
        <Button variant="outline" onClick={convert} disabled={saving}>
          <FileUp size={16} /> To invoice
        </Button>
      </div>

      <button onClick={remove} className="mt-6 flex items-center gap-2 text-sm text-danger">
        <Trash2 size={15} /> Delete quote
      </button>
    </div>
  );
}
