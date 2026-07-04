import { NextRequest, NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/session';
import { signState } from '@/lib/linkState';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
].join(' ');

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
    const redirectUri = `${baseUrl}/api/connections/google/callback`;

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID ?? '');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('state', signState(userId));

    return NextResponse.redirect(url.toString());
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect(new URL('/login', req.url));
    return NextResponse.redirect(new URL('/settings?error=google_link_failed', req.url));
  }
}
