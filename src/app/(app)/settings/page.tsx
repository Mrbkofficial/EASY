'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useBusiness } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field, Spinner } from '@/components/ui/Bits';
import { apiPatch } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { IRISH_VAT_RATES } from '@/lib/money';

export default function SettingsPage() {
  const { business, isLoading, mutate } = useBusiness();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState({
    businessName: '', businessEmail: '', phone: '', address: '', eircode: '',
    vatNumber: '', taxNumber: '', bankDetails: '', defaultVatRate: '13.5',
    quotePrefix: 'Q', invoicePrefix: 'INV', quoteTerms: '', invoiceTerms: '', logoUrl: '',
  });

  useEffect(() => {
    if (business && !hydrated) {
      setForm({
        businessName: business.businessName ?? '',
        businessEmail: business.businessEmail ?? '',
        phone: business.phone ?? '',
        address: business.address ?? '',
        eircode: business.eircode ?? '',
        vatNumber: business.vatNumber ?? '',
        taxNumber: business.taxNumber ?? '',
        bankDetails: business.bankDetails ?? '',
        defaultVatRate: String(business.defaultVatRate ?? 13.5),
        quotePrefix: business.quotePrefix ?? 'Q',
        invoicePrefix: business.invoicePrefix ?? 'INV',
        quoteTerms: business.quoteTerms ?? '',
        invoiceTerms: business.invoiceTerms ?? '',
        logoUrl: business.logoUrl ?? '',
      });
      setHydrated(true);
    }
  }, [business, hydrated]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      await apiPatch('/api/business', {
        ...form,
        defaultVatRate: parseFloat(form.defaultVatRate) || 13.5,
      });
      await mutate();
      toast('Business profile saved', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <Spinner />;

  return (
    <div>
      <Link href="/more" className="mb-3 inline-flex items-center gap-1 text-sm text-base-muted">
        <ArrowLeft size={16} /> More
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Business profile</h1>
      <p className="mb-5 text-sm text-base-muted">This appears on your quotes and invoices.</p>

      <Card className="mb-5 space-y-3 p-4">
        <Field label="Business name">
          <Input value={form.businessName} onChange={set('businessName')} placeholder="O'Brien Plumbing & Heating" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="087 123 4567" inputMode="tel" />
          </Field>
          <Field label="Email">
            <Input value={form.businessEmail} onChange={set('businessEmail')} placeholder="info@obrien.ie" inputMode="email" />
          </Field>
        </div>
        <Field label="Address">
          <Input value={form.address} onChange={set('address')} placeholder="Unit 4, Business Park, Galway" />
        </Field>
        <Field label="Eircode">
          <Input value={form.eircode} onChange={set('eircode')} placeholder="H91 XXXX" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="VAT number">
            <Input value={form.vatNumber} onChange={set('vatNumber')} placeholder="IE1234567X" />
          </Field>
          <Field label="Tax ref (optional)">
            <Input value={form.taxNumber} onChange={set('taxNumber')} />
          </Field>
        </div>
        <Field label="Logo URL (optional)">
          <Input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://…/logo.png" inputMode="url" />
        </Field>
      </Card>

      <h2 id="invoicing" className="mb-2 text-sm font-semibold text-base-muted">Invoicing</h2>
      <Card className="mb-5 space-y-3 p-4">
        <Field label="Default VAT rate">
          <select
            className="w-full appearance-none rounded-xl border border-base-border bg-base-surface px-3.5 py-2.5 text-sm"
            value={form.defaultVatRate}
            onChange={set('defaultVatRate')}
          >
            {IRISH_VAT_RATES.map((r) => (
              <option key={r.rate} value={r.rate}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quote prefix">
            <Input value={form.quotePrefix} onChange={set('quotePrefix')} placeholder="Q" />
          </Field>
          <Field label="Invoice prefix">
            <Input value={form.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" />
          </Field>
        </div>
        <Field label="Bank / payment details (shown on invoices)">
          <Textarea
            rows={3}
            value={form.bankDetails}
            onChange={set('bankDetails')}
            placeholder={'Bank: AIB\nIBAN: IE00 AIBK 0000 0000 0000 00\nBIC: AIBKIE2D'}
          />
        </Field>
        <Field label="Default quote terms">
          <Textarea rows={2} value={form.quoteTerms} onChange={set('quoteTerms')} placeholder="Quote valid for 30 days. 50% deposit required to book." />
        </Field>
        <Field label="Default invoice terms">
          <Textarea rows={2} value={form.invoiceTerms} onChange={set('invoiceTerms')} placeholder="Payment due within 30 days." />
        </Field>
      </Card>

      <div className="sticky bottom-24 sm:bottom-4">
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save profile
        </Button>
      </div>
    </div>
  );
}
