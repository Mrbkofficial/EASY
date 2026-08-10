'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { storeConfig } from '@/lib/store.config';

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}

function SuccessInner() {
  const params = useSearchParams();
  const reference = params.get('ref');
  const { clear } = useCart();

  // Payment succeeded — empty the cart (covers the Stripe redirect path).
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="mx-auto flex max-w-content flex-col items-center px-4 py-24 text-center">
      <CheckCircle2 className="h-16 w-16 text-brand-600" />
      <h1 className="mt-6 text-3xl font-bold text-neutral-900">Thank you for your order!</h1>
      <p className="mt-3 max-w-md text-neutral-600">
        We&apos;ve received your payment and started processing your order. A confirmation email is on its
        way to your inbox.
      </p>
      {reference && (
        <p className="mt-6 rounded-full bg-neutral-100 px-5 py-2 text-sm font-medium text-neutral-700">
          Order reference: <span className="font-bold text-brand-700">{reference}</span>
        </p>
      )}
      <p className="mt-8 text-sm text-neutral-500">
        Questions? Email us at{' '}
        <a href={`mailto:${storeConfig.supportEmail}`} className="text-brand-700 hover:underline">
          {storeConfig.supportEmail}
        </a>
        .
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
      >
        Continue shopping
      </Link>
    </div>
  );
}
