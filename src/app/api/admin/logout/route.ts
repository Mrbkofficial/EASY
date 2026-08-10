import { NextRequest, NextResponse } from 'next/server';
import { adminCookieName } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin/login', req.url));
  res.cookies.delete(adminCookieName());
  return res;
}
