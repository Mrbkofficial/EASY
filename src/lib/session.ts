import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
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
