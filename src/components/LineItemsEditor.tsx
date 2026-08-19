'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input, Select } from '@/components/ui/Input';
import { computeTotals, formatEUR, IRISH_VAT_RATES } from '@/lib/money';
import type { LineItem } from '@/types';

export function LineItemsEditor({
  items,
  onChange,
  defaultVatRate = 13.5,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  defaultVatRate?: number;
}) {
  const totals = computeTotals(items);

  const update = (i: number, patch: Partial<LineItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addRow = () =>
    onChange([...items, { description: '', quantity: 1, unitPrice: 0, vatRate: defaultVatRate }]);

  const removeRow = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
          return (
            <div key={i} className="rounded-xl border border-base-border p-3">
              <div className="mb-2 flex items-start gap-2">
                <Input
                  className="flex-1"
                  placeholder="Description (e.g. Labour — 2 days)"
                  value={item.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
                <button
                  onClick={() => removeRow(i)}
                  className="mt-1 shrink-0 text-base-muted hover:text-danger"
                  aria-label="Remove line"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-base-muted">Qty</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    value={item.quantity}
                    onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-base-muted">Unit €</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => update(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-base-muted">VAT</label>
                  <Select value={item.vatRate} onChange={(e) => update(i, { vatRate: parseFloat(e.target.value) })}>
                    {IRISH_VAT_RATES.map((r) => (
                      <option key={r.rate} value={r.rate}>
                        {r.rate}%
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <p className="mt-2 text-right text-xs text-base-muted">Line: {formatEUR(lineTotal)}</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={addRow}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-base-border py-2.5 text-sm font-medium text-accent"
      >
        <Plus size={16} /> Add line
      </button>

      {/* Totals */}
      <div className="mt-4 space-y-1 rounded-xl bg-base-surface2 p-4 text-sm">
        <Row label="Subtotal (ex. VAT)" value={formatEUR(totals.subtotal)} />
        {totals.vatByRate
          .filter((v) => v.vat > 0)
          .map((v) => (
            <Row key={v.rate} label={`VAT @ ${v.rate}%`} value={formatEUR(v.vat)} muted />
          ))}
        <Row label="VAT total" value={formatEUR(totals.vatTotal)} muted />
        <div className="mt-1 border-t border-base-border pt-2">
          <Row label="Total" value={formatEUR(totals.total)} bold />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-base-muted' : ''} ${bold ? 'text-base font-semibold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
