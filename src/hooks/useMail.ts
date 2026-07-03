'use client';

import useSWR from 'swr';
import type { Mode, UnifiedMessage } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMail(mode: Mode) {
  const { data, error, isLoading, mutate } = useSWR<{ messages: UnifiedMessage[] }>(
    `/api/mail/messages?mode=${mode}`,
    fetcher,
    { refreshInterval: 120_000 }
  );
  return { messages: data?.messages ?? [], error, isLoading, mutate };
}

export async function sendMail(payload: {
  provider: 'google' | 'outlook' | 'apple';
  to: string;
  subject: string;
  text: string;
  threadId?: string;
  inReplyTo?: string;
}) {
  const res = await fetch('/api/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}
