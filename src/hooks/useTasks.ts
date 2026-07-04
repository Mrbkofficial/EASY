'use client';

import useSWR from 'swr';
import type { Mode } from '@/types';

export interface Task {
  id: string;
  userId: string;
  mode: Mode;
  title: string;
  notes: string | null;
  dueAt: string | null;
  allDay: boolean;
  completed: boolean;
  completedAt: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string | null;
  color: string | null;
  recurrence: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  reminderOffsets: number[];
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTasks(opts: { mode?: Mode; from?: string; to?: string; completed?: boolean } = {}) {
  const params = new URLSearchParams();
  if (opts.mode) params.set('mode', opts.mode);
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  if (opts.completed !== undefined) params.set('completed', String(opts.completed));

  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[] }>(
    `/api/tasks?${params.toString()}`,
    fetcher
  );

  return { tasks: data?.tasks ?? [], error, isLoading, mutate };
}

export async function createTask(payload: Partial<Task> & { title: string }) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id: string, payload: Partial<Task>) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: string) {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}
