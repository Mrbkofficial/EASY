// Minimal password gate for the owner's admin dashboard. A single shared
// password (ADMIN_PASSWORD) is enough for a one-owner store; the cookie stores
// only a hash so the password itself is never persisted in the browser.
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const COOKIE_NAME = 'nova_admin';

function tokenFor(password: string): string {
  // Salt with NEXTAUTH-style secret if present so the token isn't a bare hash.
  const salt = process.env.ADMIN_SECRET || 'nova-admin-salt';
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return tokenFor(pw);
}

export function adminCookieName(): string {
  return COOKIE_NAME;
}

/** True if the current request carries a valid admin session cookie. */
export function isAdmin(): boolean {
  const expected = expectedToken();
  if (!expected) return false; // no password configured => locked
  const got = cookies().get(COOKIE_NAME)?.value;
  return got === expected;
}
