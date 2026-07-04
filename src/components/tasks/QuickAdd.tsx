'use client';

import { useMemo, useState } from 'react';
import * as chrono from 'chrono-node';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function QuickAdd({
  fallbackDate,
  onAdd,
}: {
  fallbackDate: Date;
  onAdd: (title: string, dueAt: Date | null) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    if (!value.trim()) return null;
    const results = chrono.parse(value, fallbackDate, { forwardDate: true });
    if (results.length === 0) return null;
    const result = results[0];
    const cleanTitle = (value.slice(0, result.index) + value.slice(result.index + result.text.length))
      .replace(/\s{2,}/g, ' ')
      .trim();
    return { date: result.date(), cleanTitle: cleanTitle || value.trim() };
  }, [value, fallbackDate]);

  const submit = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(parsed?.cleanTitle ?? value.trim(), parsed?.date ?? null);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder='Quick add — try "Call mom tomorrow at 5pm"'
        />
        <Button size="icon" onClick={submit} disabled={submitting || !value.trim()}>
          <Plus size={18} />
        </Button>
      </div>
      {parsed && (
        <p className="flex items-center gap-1.5 pl-1 text-xs text-accent">
          <Sparkles size={12} />
          {parsed.date.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
