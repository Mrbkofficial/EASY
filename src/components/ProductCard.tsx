import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Product } from '@/data/products';
import { formatMoney } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const discount =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round((1 - product.priceCents / product.compareAtCents) * 100)
      : 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">{product.title}</h3>
        {product.rating != null && (
          <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-neutral-700">{product.rating.toFixed(1)}</span>
            {product.reviewCount != null && <span>({product.reviewCount.toLocaleString()})</span>}
          </div>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-lg font-bold text-neutral-900">{formatMoney(product.priceCents)}</span>
          {product.compareAtCents && product.compareAtCents > product.priceCents && (
            <span className="text-sm text-neutral-400 line-through">
              {formatMoney(product.compareAtCents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
