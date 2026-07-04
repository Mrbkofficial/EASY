'use client';

import useSWR from 'swr';
import type { Mode, UnifiedEvent } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvents(mode: Mode, from: string, to: string) {
  const params = new URLSearchParams({ mode, from, to });
  const { data, error, isLoading, mutate } = useSWR<{ events: UnifiedEvent[] }>(
    `/api/calendar/events?${params.toString()}`,
    fetcher
  );
  return { events: data?.events ?? [], error, isLoading, mutate };
}
