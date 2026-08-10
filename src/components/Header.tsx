'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { storeConfig } from '@/lib/store.config';

export function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          {storeConfig.name}
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
          <Link href="/" className="hidden hover:text-brand-700 sm:inline">
            Shop
          </Link>
          <Link href="/#shipping" className="hidden hover:text-brand-700 sm:inline">
            Shipping
          </Link>
          <Link href="/cart" className="relative flex items-center gap-2 hover:text-brand-700">
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
