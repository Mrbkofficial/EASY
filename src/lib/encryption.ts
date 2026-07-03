import crypto from 'crypto';

// AES-256-GCM encryption for secrets we must store but never expose (Apple app-specific passwords).
// Requires APPLE_MAIL_ENCRYPTION_KEY: a 32-byte key, base64 encoded, in the environment.

function getKey(): Buffer {
  const key = process.env.APPLE_MAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'APPLE_MAIL_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to your environment variables.'
    );
  }
  const buf = Buffer.from(key, 'base64');
  if (buf.length !== 32) {
    throw new Error('APPLE_MAIL_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }
  return buf;
}

export function encryptSecret(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted payload.');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}
