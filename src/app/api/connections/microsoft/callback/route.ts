import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyState } from '@/lib/linkState';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const userId = state ? verifyState(state) : null;

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/settings?error=microsoft_link_failed', req.url));
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
    const redirectUri = `${baseUrl}/api/connections/microsoft/callback`;
    const tenant = process.env.AZURE_AD_TENANT_ID ?? 'common';

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID ?? '',
        client_secret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const tokens = (await tokenRes.json()) as TokenResponse;

    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error('Failed to fetch Microsoft profile');
    const profile = (await profileRes.json()) as { id: string };

    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: 'azure-ad', providerAccountId: profile.id } },
      update: {
        userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token,
      },
      create: {
        userId,
        type: 'oauth',
        provider: 'azure-ad',
        providerAccountId: profile.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token,
      },
    });

    return NextResponse.redirect(new URL('/settings?connected=microsoft', req.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL('/settings?error=microsoft_link_failed', req.url));
  }
}
