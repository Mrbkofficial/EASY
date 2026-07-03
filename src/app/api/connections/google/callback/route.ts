import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { verifyState } from '@/lib/linkState';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const userId = state ? verifyState(state) : null;

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/settings?error=google_link_failed', req.url));
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/connections/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    if (!profile.id) throw new Error('No Google profile id returned');

    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.id } },
      update: {
        userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token,
      },
      create: {
        userId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: profile.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token,
      },
    });

    return NextResponse.redirect(new URL('/settings?connected=google', req.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL('/settings?error=google_link_failed', req.url));
  }
}
