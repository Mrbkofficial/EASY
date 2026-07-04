export type Mode = 'PERSONAL' | 'WORK';

export type MailProvider = 'google' | 'outlook' | 'apple';

export interface UnifiedMessage {
  id: string;
  provider: MailProvider;
  threadId?: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isRead: boolean;
}

export interface UnifiedEvent {
  id: string;
  provider: 'google' | 'outlook';
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
}
