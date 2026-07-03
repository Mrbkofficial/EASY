import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

// Returns an authenticated googleapis OAuth2 client for the given user, refreshing
// the access token (and persisting the refreshed token) if it has expired.
export async function getGoogleAuthForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
  });
  if (!account) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  const isExpired = account.expires_at ? account.expires_at * 1000 < Date.now() + 60_000 : true;

  if (isExpired && account.refresh_token) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : undefined,
        refresh_token: credentials.refresh_token ?? account.refresh_token,
      },
    });
  }

  return oauth2Client;
}

export async function isGoogleConnected(userId: string) {
  const account = await prisma.account.findFirst({ where: { userId, provider: 'google' } });
  return !!account;
}
