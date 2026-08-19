// Build a WhatsApp deep link (wa.me) with a pre-filled message. This uses the
// free click-to-chat mechanism — no WhatsApp Business API needed.

// Normalise an Irish phone number to international format for wa.me.
export function normalizeIrishPhone(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('00')) return digits.slice(2);
  // Local Irish number starting 0 -> +353
  if (digits.startsWith('0')) return '353' + digits.slice(1);
  if (digits.startsWith('353')) return digits;
  return digits;
}

export function whatsappLink(phone: string | null | undefined, message: string): string {
  const normalized = normalizeIrishPhone(phone);
  const text = encodeURIComponent(message);
  return normalized
    ? `https://wa.me/${normalized}?text=${text}`
    : `https://wa.me/?text=${text}`;
}
