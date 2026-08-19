'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Bits';
import { apiPost, apiPatch } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { useCustomers } from '@/hooks/useData';
import { TRADES, JOB_STATUS } from '@/lib/trades';
import type { Job } from '@/types';

function toDateInput(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export function JobModal({
  open,
  onClose,
  onSaved,
  job,
  defaultCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (j: Job) => void;
  job?: Job | null;
  defaultCustomerId?: string;
}) {
  const { toast } = useToast();
  const { customers } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: job?.customerId ?? defaultCustomerId ?? '',
    title: job?.title ?? '',
    trade: job?.trade ?? 'GENERAL',
    status: job?.status ?? 'LEAD',
    description: job?.description ?? '',
    address: job?.address ?? '',
    eircode: job?.eircode ?? '',
    scheduledFor: toDateInput(job?.scheduledFor),
    notes: job?.notes ?? '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (!form.customerId) return toast('Choose a customer', 'error');
    if (!form.title.trim()) return toast('Job title is required', 'error');
    setLoading(true);
    const payload = {
      ...form,
      scheduledFor: form.scheduledFor ? new Date(form.scheduledFor + 'T09:00:00').toISOString() : null,
    };
    try {
      const res = job
        ? await apiPatch<{ job: Job }>(`/api/jobs/${job.id}`, payload)
        : await apiPost<{ job: Job }>('/api/jobs', payload);
      toast(job ? 'Job updated' : 'Job created', 'success');
      onSaved(res.job);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={job ? 'Edit job' : 'New job'}>
      <div className="space-y-3">
        <Field label="Customer *">
          <Select value={form.customerId} onChange={set('customerId')} disabled={!!job}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Job title *">
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Bathroom re-plumb" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trade">
            <Select value={form.trade} onChange={set('trade')}>
              {Object.entries(TRADES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {Object.entries(JOB_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Scheduled date">
          <Input type="date" value={form.scheduledFor} onChange={set('scheduledFor')} />
        </Field>
        <Field label="Site address (if different)">
          <Input value={form.address} onChange={set('address')} placeholder="Job location" />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={form.description} onChange={set('description')} placeholder="Scope of works…" />
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
