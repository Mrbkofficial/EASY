'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Bits';
import { apiPost, apiPatch } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import type { Customer } from '@/types';

export function CustomerModal({
  open,
  onClose,
  onSaved,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (c: Customer) => void;
  customer?: Customer | null;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    eircode: customer?.eircode ?? '',
    notes: customer?.notes ?? '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (!form.name.trim()) return toast('Name is required', 'error');
    setLoading(true);
    try {
      const res = customer
        ? await apiPatch<{ customer: Customer }>(`/api/customers/${customer.id}`, form)
        : await apiPost<{ customer: Customer }>('/api/customers', form);
      toast(customer ? 'Customer updated' : 'Customer added', 'success');
      onSaved(res.customer);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={customer ? 'Edit customer' : 'New customer'}>
      <div className="space-y-3">
        <Field label="Name *">
          <Input value={form.name} onChange={set('name')} placeholder="e.g. Mary Kelly" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="087 123 4567" inputMode="tel" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={set('email')} placeholder="mary@email.ie" inputMode="email" />
          </Field>
        </div>
        <Field label="Address">
          <Input value={form.address} onChange={set('address')} placeholder="12 Main St, Galway" />
        </Field>
        <Field label="Eircode">
          <Input value={form.eircode} onChange={set('eircode')} placeholder="H91 XXXX" />
        </Field>
        <Field label="Notes">
          <Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Gate code, access notes…" />
        </Field>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save} disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
