'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShoppingBag } from 'lucide-react';
import type { PublicProduct } from '@/data/products';
import { useCart } from '@/lib/cart';

export function AddToCart({ product }: { product: PublicProduct }) {
  const { add } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    product.options?.forEach((o) => (init[o.name] = o.values[0]));
    return init;
  });
  const [added, setAdded] = useState(false);

  const variant = product.options?.length
    ? product.options.map((o) => selected[o.name]).join(' / ')
    : undefined;

  function handleAdd(goToCart: boolean) {
    add(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        image: product.images[0],
        unitPrice: product.priceCents,
        variant,
      },
      quantity,
    );
    if (goToCart) {
      router.push('/cart');
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  }

  return (
    <div className="space-y-5">
      {product.options?.map((option) => (
        <div key={option.name}>
          <p className="mb-2 text-sm font-medium text-neutral-900">{option.name}</p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isActive = selected[option.name] === value;
              return (
                <button
                  key={value}
                  onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    isActive
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-400'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-900">Qty</span>
        <div className="flex items-center rounded-full border border-neutral-300">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-l-full text-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="h-9 w-9 rounded-r-full text-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => handleAdd(false)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-600 px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
          {added ? 'Added to cart' : 'Add to cart'}
        </button>
        <button
          onClick={() => handleAdd(true)}
          className="flex-1 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
