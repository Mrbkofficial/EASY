import { graphFetch } from '@/lib/graph';
import type { UnifiedMessage, UnifiedEvent } from '@/types';

interface GraphMessage {
  id: string;
  subject?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  body?: { contentType: string; content: string };
  toRecipients?: { emailAddress?: { address?: string } }[];
}

interface GraphEvent {
  id: string;
  subject?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  isAllDay?: boolean;
  location?: { displayName?: string };
  bodyPreview?: string;
}

export async function listOutlookMessages(userId: string, top = 25): Promise<UnifiedMessage[]> {
  const res = await graphFetch(
    userId,
    `/me/mailFolders/inbox/messages?$top=${top}&$select=id,subject,from,bodyPreview,receivedDateTime,isRead`
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { value: GraphMessage[] };
  return data.value.map((m) => ({
    id: m.id,
    provider: 'outlook' as const,
    subject: m.subject || '(no subject)',
    from: m.from?.emailAddress?.address || m.from?.emailAddress?.name || 'unknown',
    snippet: m.bodyPreview ?? '',
    date: m.receivedDateTime ?? new Date().toISOString(),
    isRead: !!m.isRead,
  }));
}

export async function getOutlookMessage(userId: string, id: string) {
  const res = await graphFetch(userId, `/me/messages/${id}`);
  if (!res.ok) throw new Error('Failed to fetch message.');
  const m = (await res.json()) as GraphMessage;
  return {
    subject: m.subject || '(no subject)',
    from: m.from?.emailAddress?.address || 'unknown',
    to: (m.toRecipients ?? []).map((r) => r.emailAddress?.address).filter(Boolean).join(', '),
    date: m.receivedDateTime ?? new Date().toISOString(),
    html: m.body?.contentType === 'html' ? m.body.content : undefined,
    text: m.body?.contentType === 'text' ? m.body.content : undefined,
  };
}

export async function sendOutlookMessage(userId: string, opts: { to: string; subject: string; text: string }) {
  const res = await graphFetch(userId, '/me/sendMail', {
    method: 'POST',
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: 'Text', content: opts.text },
        toRecipients: [{ emailAddress: { address: opts.to } }],
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to send message.');
}

export async function listOutlookEvents(userId: string, start: string, end: string): Promise<UnifiedEvent[]> {
  const res = await graphFetch(
    userId,
    `/me/calendarView?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}&$orderby=start/dateTime&$top=100`
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { value: GraphEvent[] };
  return data.value.map((e) => ({
    id: e.id,
    provider: 'outlook' as const,
    title: e.subject || '(no title)',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    allDay: !!e.isAllDay,
    location: e.location?.displayName,
    description: e.bodyPreview,
  }));
}

export async function createOutlookEvent(
  userId: string,
  opts: { title: string; start: string; end: string; allDay: boolean; description?: string; location?: string }
) {
  const res = await graphFetch(userId, '/me/events', {
    method: 'POST',
    body: JSON.stringify({
      subject: opts.title,
      body: { contentType: 'Text', content: opts.description ?? '' },
      start: { dateTime: opts.start, timeZone: 'UTC' },
      end: { dateTime: opts.end, timeZone: 'UTC' },
      isAllDay: opts.allDay,
      location: opts.location ? { displayName: opts.location } : undefined,
    }),
  });
  if (!res.ok) throw new Error('Failed to create event.');
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function updateOutlookEvent(
  userId: string,
  eventId: string,
  opts: { title?: string; start?: string; end?: string; allDay?: boolean; description?: string; location?: string }
) {
  const res = await graphFetch(userId, `/me/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      subject: opts.title,
      start: opts.start ? { dateTime: opts.start, timeZone: 'UTC' } : undefined,
      end: opts.end ? { dateTime: opts.end, timeZone: 'UTC' } : undefined,
      isAllDay: opts.allDay,
      location: opts.location ? { displayName: opts.location } : undefined,
    }),
  });
  if (!res.ok) throw new Error('Failed to update event.');
}

export async function deleteOutlookEvent(userId: string, eventId: string) {
  const res = await graphFetch(userId, `/me/events/${eventId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete event.');
}
