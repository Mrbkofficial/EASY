import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireUserId } from '@/lib/session';

// Wraps a route handler: resolves the current user id, runs the handler, and
// maps auth/validation/unknown errors to consistent JSON responses.
export async function withUser(
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    return await handler(userId);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
