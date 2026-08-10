'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { formatMoney } from '@/lib/utils';
import { shippingFor, storeConfig } from '@/lib/store.config';

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove } = useCart();
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-content flex-col items-center px-4 py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-neutral-300" />
        <h1 className="mt-4 text-2xl font-bold text-neutral-900">Your cart is empty</h1>
        <p className="mt-2 text-neutral-500">Find something you love and it&apos;ll show up here.</p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900">Your cart</h1>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-4 py-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                  <Image src={line.image} alt={line.title} fill sizes="96px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <Link href={`/product/${line.slug}`} className="font-semibold text-neutral-900 hover:text-brand-700">
                      {line.title}
                    </Link>
                    <span className="font-semibold text-neutral-900">
                      {formatMoney(line.unitPrice * line.quantity)}
                    </span>
                  </div>
                  {line.variant && <p className="mt-0.5 text-sm text-neutral-500">{line.variant}</p>}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border border-neutral-300">
                      <button
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        className="h-8 w-8 rounded-l-full text-neutral-600 hover:bg-neutral-100"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                      <button
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        className="h-8 w-8 rounded-r-full text-neutral-600 hover:bg-neutral-100"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(line.key)}
                      className="flex items-center gap-1 text-sm text-neutral-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-lg font-bold text-neutral-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="font-medium">{shipping === 0 ? 'Free' : formatMoney(shipping)}</dd>
            </div>
            {storeConfig.freeShippingThresholdCents > 0 && shipping > 0 && (
              <p className="text-xs text-brand-700">
                Add {formatMoney(storeConfig.freeShippingThresholdCents - subtotal)} more for free shipping.
              </p>
            )}
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-brand-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-700"
          >
            Checkout
          </Link>
          <p className="mt-3 text-center text-xs text-neutral-400">Apple Pay · Card · PayPal</p>
        </div>
      </div>
    </div>
  );
}
