import { NextRequest, NextResponse } from 'next/server';
import { adminCookieName, expectedToken } from '@/lib/admin';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const expected = expectedToken();
  if (!expected) {
    return NextResponse.json({ error: 'Admin is not configured (set ADMIN_PASSWORD).' }, { status: 503 });
  }

  const form = await req.formData();
  const password = String(form.get('password') || '');
  const salt = process.env.ADMIN_SECRET || 'nova-admin-salt';
  const token = createHash('sha256').update(`${salt}:${password}`).digest('hex');

  if (token !== expected) {
    return NextResponse.redirect(new URL('/admin/login?error=1', req.url));
  }

  const res = NextResponse.redirect(new URL('/admin', req.url));
  res.cookies.set(adminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
