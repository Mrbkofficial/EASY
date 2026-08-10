import { activeProducts } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { storeConfig } from '@/lib/store.config';
import { Truck, ShieldCheck, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const items = activeProducts();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-brand-100">
        <div className="mx-auto max-w-content px-4 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            {storeConfig.name}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {storeConfig.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-neutral-600">
            Handpicked gadgets, home upgrades and everyday essentials — shipped worldwide with secure
            Apple&nbsp;Pay, card and PayPal checkout.
          </p>
          <a
            href="#shop"
            className="mt-8 inline-block rounded-full bg-brand-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Shop the collection
          </a>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-4 px-4 py-6 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-3 text-neutral-700">
            <Truck className="h-5 w-5 text-brand-600" />
            <span>Worldwide shipping</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-700">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <span>Secure Stripe & PayPal checkout</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-700">
            <RefreshCw className="h-5 w-5 text-brand-600" />
            <span>30-day easy returns</span>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section id="shop" className="mx-auto max-w-content px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-neutral-900">Trending now</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-neutral-800">New arrivals dropping soon</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              We&apos;re stocking the shelves right now. Check back shortly — the collection goes live any moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
