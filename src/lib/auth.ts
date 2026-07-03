import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from '@/lib/prisma';

// Scopes needed to read/write Gmail and Google Calendar.
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
].join(' ');

// Scopes needed to read/write Outlook mail and calendar via Microsoft Graph.
const MICROSOFT_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.ReadWrite',
].join(' ');

const providers: NextAuthOptions['providers'] = [];
export const configuredProviders: string[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  );
  configuredProviders.push('google');
}

if (
  process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_SECRET &&
  process.env.AZURE_AD_TENANT_ID
) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: { params: { scope: MICROSOFT_SCOPES } },
    })
  );
  configuredProviders.push('azure-ad');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'database' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      await prisma.budgetCategory.createMany({
        data: [
          { userId: user.id, mode: 'PERSONAL', name: 'Groceries', color: '#22c55e' },
          { userId: user.id, mode: 'PERSONAL', name: 'Dining', color: '#f59e0b' },
          { userId: user.id, mode: 'PERSONAL', name: 'Transport', color: '#3b82f6' },
          { userId: user.id, mode: 'PERSONAL', name: 'Shopping', color: '#ec4899' },
          { userId: user.id, mode: 'PERSONAL', name: 'Bills & Utilities', color: '#ef4444' },
          { userId: user.id, mode: 'PERSONAL', name: 'Other', color: '#94a3b8' },
          { userId: user.id, mode: 'WORK', name: 'Travel', color: '#3b82f6' },
          { userId: user.id, mode: 'WORK', name: 'Meals', color: '#f59e0b' },
          { userId: user.id, mode: 'WORK', name: 'Software', color: '#8b5cf6' },
          { userId: user.id, mode: 'WORK', name: 'Office Supplies', color: '#22c55e' },
          { userId: user.id, mode: 'WORK', name: 'Other', color: '#94a3b8' },
        ],
        skipDuplicates: true,
      });
    },
  },
};
