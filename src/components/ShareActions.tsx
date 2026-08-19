'use client';

import { MessageCircle, Link2, FileDown, Check } from 'lucide-react';
import { useState } from 'react';
import { whatsappLink } from '@/lib/whatsapp';
import { formatEUR } from '@/lib/money';
import { useToast } from '@/context/ToastContext';

export function ShareActions({
  kind,
  number,
  total,
  shareToken,
  customerName,
  customerPhone,
  businessName,
  dueDate,
}: {
  kind: 'quote' | 'invoice';
  number: string;
  total: number;
  shareToken: string;
  customerName: string;
  customerPhone?: string | null;
  businessName?: string | null;
  dueDate?: string | null;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const path = `/${kind === 'quote' ? 'q' : 'i'}/${shareToken}`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
  const noun = kind === 'quote' ? 'quote' : 'invoice';

  const message =
    kind === 'quote'
      ? `Hi ${customerName}, here's your quote ${number}${businessName ? ` from ${businessName}` : ''} for ${formatEUR(
          total
        )}. You can view it here: ${shareUrl}\n\nLet me know if you'd like to go ahead. Thanks!`
      : `Hi ${customerName}, please find invoice ${number}${businessName ? ` from ${businessName}` : ''} for ${formatEUR(
          total
        )}${dueDate ? `, due ${new Date(dueDate).toLocaleDateString('en-IE')}` : ''}. View & details: ${shareUrl}\n\nThanks!`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast('Link copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy link', 'error');
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <a
        href={whatsappLink(customerPhone, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1 rounded-xl bg-[#25D366] py-3 text-xs font-medium text-white transition active:scale-95"
      >
        <MessageCircle size={18} />
        WhatsApp
      </a>
      <button
        onClick={copyLink}
        className="flex flex-col items-center gap-1 rounded-xl border border-base-border py-3 text-xs font-medium transition hover:bg-base-surface2"
      >
        {copied ? <Check size={18} className="text-success" /> : <Link2 size={18} className="text-accent" />}
        Copy link
      </button>
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1 rounded-xl border border-base-border py-3 text-xs font-medium transition hover:bg-base-surface2"
        title={`Open printable ${noun} to save as PDF`}
      >
        <FileDown size={18} className="text-accent" />
        PDF
      </a>
    </div>
  );
}
