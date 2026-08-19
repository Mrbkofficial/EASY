'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Bits';
import { apiPost } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { useCustomers } from '@/hooks/useData';

// Creates an empty draft quote or invoice for a chosen customer, then opens the editor.
export function NewDocumentModal({
  open,
  onClose,
  kind,
  defaultCustomerId,
  defaultJobId,
}: {
  open: boolean;
  onClose: () => void;
  kind: 'quote' | 'invoice';
  defaultCustomerId?: string;
  defaultJobId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? '');
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!customerId) return toast('Choose a customer', 'error');
    setLoading(true);
    try {
      const url = kind === 'quote' ? '/api/quotes' : '/api/invoices';
      const res = await apiPost<{ quote?: { id: string }; invoice?: { id: string } }>(url, {
        customerId,
        jobId: defaultJobId ?? null,
        items: [],
      });
      const id = res.quote?.id ?? res.invoice?.id;
      router.push(`/${kind === 'quote' ? 'quotes' : 'invoices'}/${id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to create', 'error');
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={kind === 'quote' ? 'New quote' : 'New invoice'}>
      <div className="space-y-4">
        <Field label="Customer *">
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={!!defaultCustomerId}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {customers.length === 0 && (
          <p className="text-xs text-base-muted">Add a customer first, then create a {kind}.</p>
        )}
        <Button className="w-full" onClick={create} disabled={loading}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create {kind}
        </Button>
      </div>
    </Modal>
  );
}
