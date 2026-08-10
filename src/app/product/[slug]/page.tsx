import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Star, Check, Truck, ShieldCheck } from 'lucide-react';
import { activeProducts, getProduct, toPublic } from '@/data/products';
import { formatMoney } from '@/lib/utils';
import { Gallery } from '@/components/Gallery';
import { AddToCart } from '@/components/AddToCart';

export function generateStaticParams() {
  return activeProducts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProduct(params.slug);
  if (!product) return { title: 'Not found' };
  return { title: product.title, description: product.blurb };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  const discount =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round((1 - product.priceCents / product.compareAtCents) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery images={product.images} alt={product.title} />

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
            {product.category}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">{product.title}</h1>

          {product.rating != null && (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-neutral-800">{product.rating.toFixed(1)}</span>
              {product.reviewCount != null && <span>· {product.reviewCount.toLocaleString()} reviews</span>}
            </div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900">{formatMoney(product.priceCents)}</span>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <>
                <span className="text-lg text-neutral-400 line-through">
                  {formatMoney(product.compareAtCents)}
                </span>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-sm font-semibold text-brand-700">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-neutral-700">{product.description}</p>

          {product.highlights && product.highlights.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-neutral-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <AddToCart product={toPublic(product)} />
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-neutral-200 pt-6 text-sm text-neutral-600">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-600" /> Free tracked shipping on qualifying orders
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" /> Secure Apple Pay, card & PayPal checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
