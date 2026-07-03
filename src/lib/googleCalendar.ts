import { google } from 'googleapis';
import { getGoogleAuthForUser } from '@/lib/google';
import type { UnifiedEvent } from '@/types';

export async function listGoogleEvents(userId: string, timeMin: string, timeMax: string): Promise<UnifiedEvent[]> {
  const auth = await getGoogleAuthForUser(userId);
  if (!auth) return [];
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });

  return (res.data.items ?? []).map((event) => ({
    id: event.id!,
    provider: 'google' as const,
    title: event.summary || '(no title)',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    allDay: !event.start?.dateTime,
    location: event.location ?? undefined,
    description: event.description ?? undefined,
  }));
}

export async function createGoogleEvent(
  userId: string,
  opts: { title: string; start: string; end: string; allDay: boolean; description?: string; location?: string }
) {
  const auth = await getGoogleAuthForUser(userId);
  if (!auth) throw new Error('Google account not connected.');
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: opts.title,
      description: opts.description,
      location: opts.location,
      start: opts.allDay ? { date: opts.start.slice(0, 10) } : { dateTime: opts.start },
      end: opts.allDay ? { date: opts.end.slice(0, 10) } : { dateTime: opts.end },
    },
  });
  return res.data.id;
}

export async function updateGoogleEvent(
  userId: string,
  eventId: string,
  opts: { title?: string; start?: string; end?: string; allDay?: boolean; description?: string; location?: string }
) {
  const auth = await getGoogleAuthForUser(userId);
  if (!auth) throw new Error('Google account not connected.');
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: {
      summary: opts.title,
      description: opts.description,
      location: opts.location,
      start: opts.start ? (opts.allDay ? { date: opts.start.slice(0, 10) } : { dateTime: opts.start }) : undefined,
      end: opts.end ? (opts.allDay ? { date: opts.end.slice(0, 10) } : { dateTime: opts.end }) : undefined,
    },
  });
}

export async function deleteGoogleEvent(userId: string, eventId: string) {
  const auth = await getGoogleAuthForUser(userId);
  if (!auth) throw new Error('Google account not connected.');
  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({ calendarId: 'primary', eventId }).catch((err) => {
    if (err?.code !== 410 && err?.code !== 404) throw err;
  });
}
