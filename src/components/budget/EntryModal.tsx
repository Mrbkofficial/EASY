'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label, Textarea } from '@/components/ui/Input';
import type { BudgetCategory, BudgetEntry } from '@/hooks/useBudget';

interface EntryModalProps {
  open: boolean;
  onClose: () => void;
  entry?: BudgetEntry | null;
  categories: BudgetCategory[];
  prefill?: { amount?: number | null; merchant?: string | null; date?: string | null; receiptUrl?: string | null };
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function toDateInput(dateStr?: string | null) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toISOString().slice(0, 10);
}

export function EntryModal({ open, onClose, entry, categories, prefill, onSave, onDelete }: EntryModalProps) {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setAmount(String(entry.amount));
      setMerchant(entry.merchant ?? '');
      setDate(toDateInput(entry.date));
      setCategoryId(entry.categoryId ?? '');
      setNote(entry.note ?? '');
    } else {
      setAmount(prefill?.amount ? String(prefill.amount) : '');
      setMerchant(prefill?.merchant ?? '');
      setDate(toDateInput(prefill?.date));
      setCategoryId(categories[0]?.id ?? '');
      setNote('');
    }
  }, [open, entry, prefill, categories]);

  const handleSave = async () => {
    const numeric = parseFloat(amount);
    if (!numeric || numeric <= 0) return;
    setSaving(true);
    try {
      await onSave({
        amount: numeric,
        merchant: merchant.trim() || null,
        date: new Date(date).toISOString(),
        categoryId: categoryId || null,
        note: note.trim() || null,
        ...(prefill?.receiptUrl ? { receiptUrl: prefill.receiptUrl, source: 'receipt' } : {}),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit expense' : 'New expense'}>
      <div className="space-y-4">
        {prefill?.receiptUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prefill.receiptUrl} alt="Receipt" className="max-h-48 w-full rounded-xl object-contain bg-base-surface2" />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Merchant</Label>
          <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Trader Joe's" />
        </div>

        <div>
          <Label>Category</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Note</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          {entry && onDelete ? (
            <Button variant="danger" size="icon" onClick={onDelete}>
              <Trash2 size={16} />
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !amount}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
