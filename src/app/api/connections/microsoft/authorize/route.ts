import { NextRequest, NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/session';
import { signState } from '@/lib/linkState';

const SCOPES = 'openid profile email offline_access Mail.ReadWrite Mail.Send Calendars.ReadWrite';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
    const redirectUri = `${baseUrl}/api/connections/microsoft/callback`;
    const tenant = process.env.AZURE_AD_TENANT_ID ?? 'common';

    const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
    url.searchParams.set('client_id', process.env.AZURE_AD_CLIENT_ID ?? '');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('response_mode', 'query');
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('state', signState(userId));

    return NextResponse.redirect(url.toString());
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect(new URL('/login', req.url));
    return NextResponse.redirect(new URL('/settings?error=microsoft_link_failed', req.url));
  }
}
