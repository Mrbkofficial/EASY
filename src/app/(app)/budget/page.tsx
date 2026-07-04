'use client';

import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Receipt } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMode } from '@/context/ModeContext';
import { useToast } from '@/context/ToastContext';
import { useBudgetEntries, useBudgetCategories, createEntry, updateEntry, deleteEntry, type BudgetEntry } from '@/hooks/useBudget';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EntryModal } from '@/components/budget/EntryModal';
import { ReceiptCapture, type ReceiptResult } from '@/components/budget/ReceiptCapture';
import { formatCurrency, cn } from '@/lib/utils';

export default function BudgetPage() {
  const { mode } = useMode();
  const { toast } = useToast();
  const [cursor, setCursor] = useState(() => new Date());
  const [activeEntry, setActiveEntry] = useState<BudgetEntry | null | 'new'>(null);
  const [receiptPrefill, setReceiptPrefill] = useState<ReceiptResult | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  const from = startOfMonth(cursor).toISOString();
  const to = endOfMonth(cursor).toISOString();

  const { entries, mutate } = useBudgetEntries(mode, from, to);
  const { categories, mutate: mutateCategories } = useBudgetCategories(mode);

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; color: string; value: number }>();
    for (const e of entries) {
      const key = e.category?.id ?? 'none';
      const name = e.category?.name ?? 'Uncategorized';
      const color = e.category?.color ?? '#94a3b8';
      const existing = map.get(key);
      if (existing) existing.value += e.amount;
      else map.set(key, { name, color, value: e.amount });
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [entries]);

  const handleSave = async (payload: Record<string, unknown>) => {
    try {
      if (activeEntry && activeEntry !== 'new') {
        await updateEntry(activeEntry.id, payload);
      } else {
        await createEntry({ mode, ...payload });
      }
      toast('Saved', 'success');
      mutate();
    } catch {
      toast('Could not save expense', 'error');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await fetch('/api/budget/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, name: newCategory.trim(), color: randomColor() }),
    });
    setNewCategory('');
    setShowCategoryInput(false);
    mutateCategories();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Budget</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => subMonths(c, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <span className="min-w-[7rem] text-center text-sm font-medium">{format(cursor, 'MMMM yyyy')}</span>
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <Card className="mb-5 p-5">
        <p className="text-xs font-medium uppercase text-base-muted">Total spent</p>
        <p className="mt-1 text-3xl font-semibold">{formatCurrency(total)}</p>

        {byCategory.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="h-28 w-28 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={32} outerRadius={54} paddingAngle={2}>
                    {byCategory.map((c, i) => (
                      <Cell key={i} fill={c.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {byCategory.slice(0, 5).map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setActiveEntry('new')}>
          <Plus size={14} className="mr-1.5" />
          Add expense
        </Button>
        <ReceiptCapture
          onParsed={(result) => {
            setReceiptPrefill(result);
            setActiveEntry('new');
          }}
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-muted">Categories</h2>
        <button onClick={() => setShowCategoryInput((s) => !s)} className="text-xs text-accent">
          + New
        </button>
      </div>
      {showCategoryInput && (
        <div className="mb-3 flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Category name"
          />
          <Button size="sm" onClick={handleAddCategory}>
            Add
          </Button>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1.5 rounded-full border border-base-border px-2.5 py-1 text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.name}
          </span>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-base-muted">Expenses</h2>
      <div className="space-y-2 pb-8">
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => setActiveEntry(e)}
            className="flex w-full items-center gap-3 rounded-2xl border border-base-border bg-base-surface p-3.5 text-left"
          >
            {e.receiptUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.receiptUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-base-surface2">
                <Receipt size={16} className="text-base-muted" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.merchant || 'Expense'}</p>
              <p className="truncate text-xs text-base-muted">
                {format(new Date(e.date), 'MMM d')}
                {e.category ? ` · ${e.category.name}` : ''}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold">{formatCurrency(e.amount, e.currency)}</span>
          </button>
        ))}
        {entries.length === 0 && (
          <p className={cn('py-12 text-center text-sm text-base-muted')}>No expenses logged this month yet.</p>
        )}
      </div>

      <EntryModal
        open={!!activeEntry}
        onClose={() => {
          setActiveEntry(null);
          setReceiptPrefill(null);
        }}
        entry={activeEntry === 'new' ? null : activeEntry}
        categories={categories}
        prefill={
          activeEntry === 'new' && receiptPrefill
            ? { amount: receiptPrefill.amount, merchant: receiptPrefill.merchant, date: receiptPrefill.date, receiptUrl: receiptPrefill.receiptUrl }
            : undefined
        }
        onSave={handleSave}
        onDelete={
          activeEntry && activeEntry !== 'new'
            ? async () => {
                await deleteEntry(activeEntry.id);
                setActiveEntry(null);
                mutate();
              }
            : undefined
        }
      />
    </div>
  );
}

function randomColor() {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];
  return colors[Math.floor(Math.random() * colors.length)];
}
