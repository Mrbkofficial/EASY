import Link from 'next/link';
import { storeConfig } from '@/lib/store.config';

export function Footer() {
  return (
    <footer id="shipping" className="mt-16 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-content gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold text-brand-700">{storeConfig.name}</h3>
          <p className="mt-2 max-w-xs text-sm text-neutral-500">{storeConfig.tagline}</p>
        </div>
        <div className="text-sm text-neutral-600">
          <h4 className="mb-3 font-semibold text-neutral-900">Shipping & Returns</h4>
          <ul className="space-y-1.5">
            <li>Ships worldwide in 7–15 business days.</li>
            <li>
              {storeConfig.freeShippingThresholdCents > 0
                ? `Free shipping over ${storeConfig.currencySymbol}${(storeConfig.freeShippingThresholdCents / 100).toFixed(0)}.`
                : 'Flat-rate shipping at checkout.'}
            </li>
            <li>30-day return window on unused items.</li>
          </ul>
        </div>
        <div className="text-sm text-neutral-600">
          <h4 className="mb-3 font-semibold text-neutral-900">Help</h4>
          <ul className="space-y-1.5">
            <li>
              <a href={`mailto:${storeConfig.supportEmail}`} className="hover:text-brand-700">
                {storeConfig.supportEmail}
              </a>
            </li>
            <li>
              <Link href="/cart" className="hover:text-brand-700">
                Your cart
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} {storeConfig.name}. All rights reserved. Secure checkout by Stripe & PayPal.
      </div>
    </footer>
  );
}
