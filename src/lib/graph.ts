import { prisma } from '@/lib/prisma';

const TOKEN_URL_BASE = 'https://login.microsoftonline.com';

// Returns a valid Microsoft Graph access token for the user, refreshing it
// (and persisting the refresh) if expired. Returns null if not connected.
export async function getGraphAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'azure-ad' },
  });
  if (!account) return null;

  const isExpired = account.expires_at ? account.expires_at * 1000 < Date.now() + 60_000 : true;
  if (!isExpired) return account.access_token ?? null;
  if (!account.refresh_token) return account.access_token ?? null;

  const tenant = process.env.AZURE_AD_TENANT_ID ?? 'common';
  const res = await fetch(`${TOKEN_URL_BASE}/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID ?? '',
      client_secret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
      scope: 'openid profile email offline_access Mail.ReadWrite Mail.Send Calendars.ReadWrite',
    }),
  });

  if (!res.ok) {
    return account.access_token ?? null;
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  });

  return data.access_token;
}

export async function graphFetch(userId: string, path: string, init: RequestInit = {}) {
  const token = await getGraphAccessToken(userId);
  if (!token) throw new Error('Microsoft account not connected.');
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res;
}

export async function isMicrosoftConnected(userId: string) {
  const account = await prisma.account.findFirst({ where: { userId, provider: 'azure-ad' } });
  return !!account;
}
