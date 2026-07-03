'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Inbox, Pencil, RefreshCw } from 'lucide-react';
import { useMode } from '@/context/ModeContext';
import { useMail } from '@/hooks/useMail';
import { useConnections } from '@/hooks/useConnections';
import { Button } from '@/components/ui/Button';
import { MessageDetail } from '@/components/mail/MessageDetail';
import { ComposeModal } from '@/components/mail/ComposeModal';
import { cn } from '@/lib/utils';
import type { UnifiedMessage } from '@/types';

const PROVIDER_LABEL: Record<string, string> = { google: 'Gmail', outlook: 'Outlook', apple: 'iCloud' };
const PROVIDER_COLOR: Record<string, string> = {
  google: 'bg-red-500/10 text-red-500',
  outlook: 'bg-blue-500/10 text-blue-500',
  apple: 'bg-slate-500/10 text-slate-400',
};

export default function MailPage() {
  const { mode } = useMode();
  const { messages, isLoading, mutate } = useMail(mode);
  const { connections } = useConnections();
  const [selected, setSelected] = useState<UnifiedMessage | null>(null);
  const [compose, setCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<
    { provider: 'google' | 'outlook' | 'apple'; to: string; subject: string; threadId?: string; messageId?: string } | undefined
  >(undefined);

  const availableProviders: ('google' | 'outlook' | 'apple')[] =
    mode === 'PERSONAL'
      ? [...(connections.google ? (['google'] as const) : []), ...(connections.apple ? (['apple'] as const) : [])]
      : connections.microsoft
      ? ['outlook']
      : [];

  const noAccounts = availableProviders.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mail</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => mutate()} title="Refresh">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setReplyTo(undefined);
              setCompose(true);
            }}
            disabled={noAccounts}
          >
            <Pencil size={14} className="mr-1.5" />
            Compose
          </Button>
        </div>
      </div>

      {noAccounts ? (
        <div className="rounded-2xl border border-dashed border-base-border p-10 text-center">
          <Inbox size={28} className="mx-auto mb-3 text-base-muted" />
          <p className="text-sm text-base-muted">
            {mode === 'PERSONAL'
              ? 'Connect Gmail or Apple Mail in Settings to see your inbox here.'
              : 'Connect Outlook in Settings to see your work inbox here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 pb-8">
          {messages.map((m) => (
            <button
              key={`${m.provider}-${m.id}`}
              onClick={() => setSelected(m)}
              className="flex w-full items-start gap-3 rounded-2xl border border-base-border bg-base-surface p-3.5 text-left transition hover:border-accent/40"
            >
              <span className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', m.isRead ? 'bg-transparent' : 'bg-accent')} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('truncate text-sm', !m.isRead && 'font-semibold')}>{m.from}</p>
                  <span className="shrink-0 text-[11px] text-base-muted">
                    {formatDistanceToNow(new Date(m.date), { addSuffix: false })}
                  </span>
                </div>
                <p className={cn('truncate text-sm', !m.isRead ? 'font-medium' : 'text-base-muted')}>{m.subject}</p>
                <p className="truncate text-xs text-base-muted">{m.snippet}</p>
              </div>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', PROVIDER_COLOR[m.provider])}>
                {PROVIDER_LABEL[m.provider]}
              </span>
            </button>
          ))}
          {messages.length === 0 && !isLoading && (
            <p className="py-16 text-center text-sm text-base-muted">No messages.</p>
          )}
        </div>
      )}

      {selected && (
        <MessageDetail
          message={selected}
          onClose={() => setSelected(null)}
          onReply={() => {
            setReplyTo({
              provider: selected.provider,
              to: selected.from,
              subject: selected.subject,
              threadId: selected.threadId,
              messageId: selected.id,
            });
            setSelected(null);
            setCompose(true);
          }}
        />
      )}

      <ComposeModal
        open={compose}
        onClose={() => setCompose(false)}
        availableProviders={availableProviders}
        replyTo={replyTo}
        onSent={() => mutate()}
      />
    </div>
  );
}
