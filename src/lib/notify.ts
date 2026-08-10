// Sends the owner an instant Telegram message when a sale is confirmed.
//
// Setup (see SETUP.md):
//   1. Message @BotFather on Telegram -> /newbot -> copy the bot token.
//   2. Send your new bot any message, then set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
//   3. Find your chat id by visiting:
//        https://api.telegram.org/bot<TOKEN>/getUpdates
//      after messaging the bot — it's the "chat":{"id": ... } value.
//
// If the env vars aren't set, this is a no-op (checkout still works) and logs a warning.

import type { Order, OrderItem } from '@prisma/client';
import { formatMoney } from './utils';

type OrderWithItems = Order & { items: OrderItem[] };

export async function notifyOwnerOfSale(order: OrderWithItems): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[notify] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skipping sale notification.');
    return;
  }

  const lines = order.items
    .map((i) => `• ${i.quantity}× ${i.title}${i.variant ? ` (${i.variant})` : ''} — ${formatMoney(i.unitPrice * i.quantity, order.currency)}`)
    .join('\n');

  const address = [
    order.name,
    order.address1,
    order.address2,
    [order.city, order.state, order.postal].filter(Boolean).join(', '),
    order.country,
    order.phone ? `☎ ${order.phone}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`
    : null;

  const text = [
    `🛒 <b>New sale — ${order.reference}</b>`,
    ``,
    lines,
    ``,
    `<b>Total: ${formatMoney(order.total, order.currency)}</b> (paid via ${order.provider || 'card'})`,
    ``,
    `<b>Ship to:</b>`,
    address,
    order.email ? `\n✉ ${order.email}` : '',
    adminUrl ? `\n👉 <a href="${adminUrl}">Open in admin to fulfil</a>` : '',
  ].join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error('[notify] Telegram sendMessage failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[notify] Telegram request errored:', err);
  }
}
