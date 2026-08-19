import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user ?? null;
  } catch (err) {
    // Never hard-crash a page over an auth/config error (e.g. a missing
    // NEXTAUTH_SECRET on a fresh deploy) — treat it as "not signed in" so the
    // login page still renders instead of showing a blank server error.
    console.error('getCurrentUser failed:', err);
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  const id = (user as { id?: string } | null)?.id;
  if (!id) throw new AuthError();
  return id;
}

export class AuthError extends Error {
  status = 401;
  constructor() {
    super('Not authenticated');
  }
}
