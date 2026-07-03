'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Label } from '@/components/ui/Input';
import { sendMail } from '@/hooks/useMail';
import { useToast } from '@/context/ToastContext';

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  availableProviders: ('google' | 'outlook' | 'apple')[];
  replyTo?: { provider: 'google' | 'outlook' | 'apple'; to: string; subject: string; threadId?: string; messageId?: string };
  onSent?: () => void;
}

const PROVIDER_LABEL: Record<string, string> = { google: 'Gmail', outlook: 'Outlook', apple: 'iCloud Mail' };

export function ComposeModal({ open, onClose, availableProviders, replyTo, onSent }: ComposeModalProps) {
  const { toast } = useToast();
  const [provider, setProvider] = useState<'google' | 'outlook' | 'apple'>(availableProviders[0] ?? 'google');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (replyTo) {
      setProvider(replyTo.provider);
      setTo(replyTo.to);
      setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      setText('');
    } else {
      setProvider(availableProviders[0] ?? 'google');
      setTo('');
      setSubject('');
      setText('');
    }
  }, [open, replyTo, availableProviders]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !text.trim()) return;
    setSending(true);
    try {
      await sendMail({
        provider,
        to: to.trim(),
        subject: subject.trim(),
        text,
        threadId: replyTo?.threadId,
        inReplyTo: replyTo?.messageId,
      });
      toast('Message sent', 'success');
      onSent?.();
      onClose();
    } catch {
      toast('Could not send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={replyTo ? 'Reply' : 'New message'}>
      <div className="space-y-4">
        {availableProviders.length > 1 && !replyTo && (
          <div>
            <Label>From</Label>
            <Select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}>
              {availableProviders.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <Label>To</Label>
          <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !to.trim() || !subject.trim() || !text.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
