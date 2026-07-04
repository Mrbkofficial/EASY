'use client';

import useSWR from 'swr';
import { Reply, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { UnifiedMessage } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FullMessage {
  subject: string;
  from: string;
  to: string;
  date: string;
  html?: string;
  text?: string;
}

export function MessageDetail({
  message,
  onClose,
  onReply,
}: {
  message: UnifiedMessage;
  onClose: () => void;
  onReply: () => void;
}) {
  const { data, isLoading } = useSWR<{ message: FullMessage }>(
    `/api/mail/messages/${message.provider}/${message.id}`,
    fetcher
  );
  const full = data?.message;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40 backdrop-blur-sm sm:bg-black/20">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-base-border bg-base-bg shadow-soft animate-slide-up">
        <div className="flex items-center justify-between border-b border-base-border p-4">
          <h2 className="truncate text-base font-semibold">{full?.subject ?? message.subject}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-base-muted hover:bg-base-surface2">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-sm text-base-muted">Loading…</p>
          ) : (
            <>
              <div className="mb-4 space-y-1 text-sm">
                <p>
                  <span className="text-base-muted">From:</span> {full?.from ?? message.from}
                </p>
                {full?.to && (
                  <p>
                    <span className="text-base-muted">To:</span> {full.to}
                  </p>
                )}
                <p className="text-xs text-base-muted">
                  {new Date(full?.date ?? message.date).toLocaleString()}
                </p>
              </div>

              {full?.html ? (
                <iframe
                  title="email-body"
                  sandbox=""
                  srcDoc={full.html}
                  className="h-[60vh] w-full rounded-xl border border-base-border bg-white"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-base-text">{full?.text ?? message.snippet}</p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-base-border p-4">
          <Button onClick={onReply} className="w-full">
            <Reply size={16} className="mr-2" />
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
