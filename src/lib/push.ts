import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured. Run `npm run vapid:generate` and set the env vars.');
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:notifications@example.com',
    publicKey,
    privateKey
  );
  configured = true;
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  ensureConfigured();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );

  // Prune subscriptions that are no longer valid (410 Gone / 404 Not Found).
  await Promise.all(
    results.map(async (result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number };
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {});
        }
      }
    })
  );
}
