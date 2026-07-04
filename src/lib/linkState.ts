import crypto from 'crypto';

// Signs a short-lived state token binding an OAuth "connect another account" flow
// to the currently signed-in user, so the callback can't be used to attach
// a stolen token to someone else's account.
function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error('NEXTAUTH_SECRET is not set.');
  return s;
}

export function signState(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 10 * 60_000 });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyState(state: string): string | null {
  try {
    const [encoded, sig] = state.split('.');
    if (!encoded || !sig) return null;
    const expected = crypto.createHmac('sha256', secret()).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload.userId as string;
  } catch {
    return null;
  }
}
