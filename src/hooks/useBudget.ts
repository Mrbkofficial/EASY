'use client';

import useSWR from 'swr';
import type { Mode } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface BudgetCategory {
  id: string;
  mode: Mode;
  name: string;
  color: string;
  monthlyLimit: number | null;
}

export interface BudgetEntry {
  id: string;
  mode: Mode;
  amount: number;
  currency: string;
  merchant: string | null;
  note: string | null;
  date: string;
  categoryId: string | null;
  category: BudgetCategory | null;
  receiptUrl: string | null;
  source: 'manual' | 'receipt';
}

export function useBudgetEntries(mode: Mode, from: string, to: string) {
  const params = new URLSearchParams({ mode, from, to });
  const { data, error, isLoading, mutate } = useSWR<{ entries: BudgetEntry[] }>(
    `/api/budget/entries?${params.toString()}`,
    fetcher
  );
  return { entries: data?.entries ?? [], error, isLoading, mutate };
}

export function useBudgetCategories(mode: Mode) {
  const { data, error, isLoading, mutate } = useSWR<{ categories: BudgetCategory[] }>(
    `/api/budget/categories?mode=${mode}`,
    fetcher
  );
  return { categories: data?.categories ?? [], error, isLoading, mutate };
}

export async function createEntry(payload: Record<string, unknown>) {
  const res = await fetch('/api/budget/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create entry');
  return res.json();
}

export async function updateEntry(id: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/budget/entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function deleteEntry(id: string) {
  const res = await fetch(`/api/budget/entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
  return res.json();
}
