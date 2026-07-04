import { google } from 'googleapis';
import { getGoogleAuthForUser } from '@/lib/google';
import type { UnifiedMessage } from '@/types';

function decodeBase64Url(data: string) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

export async function listGmailMessages(userId: string, maxResults = 25): Promise<UnifiedMessage[]> {
  const auth = await getGoogleAuthForUser(userId);
  if (!auth) return [];
  const gmail = google.gmail({ version: 'v1', auth });

  const list = await gmail.users.messages.list({ userId: 'me', maxResults, labelIds: ['INBOX'] });
  const ids = list.data.messages ?? [];
  if (ids.length === 0) return [];

  const messages = await Promise.all(
    ids.map(async (m) => {
      const res = await gmail.users.messages.get({
        userId: 'me',
        id: m.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });
      const headers = res.data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? '';
      return {
        id: res.data.id!,
        provider: 'google' as const,
        threadId: res.data.threadId ?? undefined,
        subject: get('Subject') || '(no subject)',
        from: get('From'),
        snippet: res.data.snippet ?? '',
        date: get('Date') || new Date().toISOString(),
        isRead: !(res.data.labelIds ?? []).includes('UNREAD'),
      };
    })
  );

  return messages;
}

export async function getGmailMessage(userId: string, id: string) {
  const auth = await getGoogleAuthForUser(userId);
  if (!auth) throw new Error('Google account not connected.');
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });

  const headers = res.data.payload?.headers ?? [];
  const get = (name: string) => headers.find((h) => h.name === name)?.value ?? '';

  function extractBody(part: typeof res.data.payload): { html?: string; text?: string } {
    if (!part) return {};
    if (part.mimeType === 'text/html' && part.body?.data) return { html: decodeBase64Url(part.body.data) };
    if (part.mimeType === 'text/plain' && part.body?.data) return { text: decodeBase64Url(part.body.data) };
    for (const child of part.parts ?? []) {
      const found = extractBody(child);
      if (found.html || found.text) return found;
    }
    return {};
  }

  const body = extractBody(res.data.payload);

  return {
    subject: get('Subject') || '(no subject)',
    from: get('From'),
    to: get('To'),
    date: get('Date') || new Date().toISOString(),
    html: body.html,
    text: body.text,
  };
}

export async function sendGmailMessage(
  userId: string,
  opts: { to: string; subject: string; text: string; threadId?: string }
) {
  const auth = await getGoogleAuthForUser(userId);
  if (!auth) throw new Error('Google account not connected.');
  const gmail = google.gmail({ version: 'v1', auth });

  const messageParts = [`To: ${opts.to}`, `Subject: ${opts.subject}`, 'Content-Type: text/plain; charset=utf-8', '', opts.text];
  const raw = Buffer.from(messageParts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId: opts.threadId },
  });
}
