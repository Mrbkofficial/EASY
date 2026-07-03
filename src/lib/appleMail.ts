import { ImapFlow, type FetchMessageObject } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { decryptSecret } from '@/lib/encryption';

export interface UnifiedMailMessage {
  id: string;
  provider: 'apple';
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isRead: boolean;
}

async function getAccount(userId: string) {
  const account = await prisma.appleMailAccount.findFirst({ where: { userId } });
  if (!account) return null;
  return { ...account, appPassword: decryptSecret(account.encryptedAppPassword) };
}

export async function isAppleMailConnected(userId: string) {
  const account = await prisma.appleMailAccount.findFirst({ where: { userId } });
  return !!account;
}

export async function listAppleMail(userId: string, limit = 25): Promise<UnifiedMailMessage[]> {
  const account = await getAccount(userId);
  if (!account) return [];

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.email, pass: account.appPassword },
    logger: false,
  });

  const messages: UnifiedMailMessage[] = [];
  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const mailbox = client.mailbox;
      if (!mailbox || typeof mailbox === 'boolean') return [];
      const total = mailbox.exists;
      if (total === 0) return [];
      const start = Math.max(1, total - limit + 1);
      for await (const msg of client.fetch(
        `${start}:${total}`,
        { envelope: true, flags: true, bodyStructure: true, source: false },
        { uid: false }
      ) as AsyncIterable<FetchMessageObject>) {
        messages.push({
          id: String(msg.uid),
          provider: 'apple',
          subject: msg.envelope?.subject ?? '(no subject)',
          from: msg.envelope?.from?.[0]?.address ?? 'unknown',
          snippet: '',
          date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : new Date().toISOString(),
          isRead: msg.flags ? msg.flags.has('\\Seen') : false,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }

  return messages.reverse();
}

export async function getAppleMailMessage(userId: string, uid: string) {
  const account = await getAccount(userId);
  if (!account) throw new Error('Apple Mail not connected.');

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.email, pass: account.appPassword },
    logger: false,
  });

  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const msg = await client.fetchOne(uid, { source: true }, { uid: false });
      if (!msg || !msg.source) return null;
      const parsed = await simpleParser(msg.source);
      return {
        subject: parsed.subject ?? '(no subject)',
        from: parsed.from?.text ?? 'unknown',
        to: parsed.to && 'text' in parsed.to ? parsed.to.text : '',
        date: parsed.date?.toISOString() ?? new Date().toISOString(),
        html: parsed.html || undefined,
        text: parsed.text || undefined,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}

export async function sendAppleMail(
  userId: string,
  opts: { to: string; subject: string; text: string; inReplyTo?: string }
) {
  const account = await getAccount(userId);
  if (!account) throw new Error('Apple Mail not connected.');

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: { user: account.email, pass: account.appPassword },
  });

  await transporter.sendMail({
    from: account.email,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    inReplyTo: opts.inReplyTo,
  });
}

export async function verifyAppleMailCredentials(email: string, appPassword: string) {
  const client = new ImapFlow({
    host: 'imap.mail.me.com',
    port: 993,
    secure: true,
    auth: { user: email, pass: appPassword },
    logger: false,
  });
  await client.connect();
  await client.logout().catch(() => client.close());
}
