import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, PackageCheck } from 'lucide-react';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/utils';
import { CopyButton } from '@/components/admin/CopyButton';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  if (!isAdmin()) redirect('/admin/login');

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) notFound();

  const addressBlock = [
    order.name,
    order.address1,
    order.address2,
    [order.city, order.state, order.postal].filter(Boolean).join(', '),
    order.country,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{order.reference}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {new Date(order.createdAt).toLocaleString()} · Paid via {order.provider || 'card'} · {order.status}
          </p>
        </div>
        {!order.fulfilled && order.status === 'PAID' && (
          <form action={`/api/admin/orders/${order.id}/fulfill`} method="POST">
            <button className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
              <PackageCheck className="h-4 w-4" /> Mark as placed on supplier
            </button>
          </form>
        )}
        {order.fulfilled && (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            <PackageCheck className="h-4 w-4" /> Fulfilled
            {order.fulfilledAt ? ` · ${new Date(order.fulfilledAt).toLocaleDateString()}` : ''}
          </span>
        )}
      </div>

      {/* Fulfilment: ship to */}
      <section className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-neutral-900">Ship to this customer</h2>
          <CopyButton text={addressBlock} label="Copy address" />
        </div>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-neutral-700">{addressBlock}</pre>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-600">
          <span>✉ {order.email}</span>
          {order.phone && <span>☎ {order.phone}</span>}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Open each product below, add it to your supplier cart, and paste this address as the delivery
          address at checkout.
        </p>
      </section>

      {/* Items with private supplier links */}
      <section className="mt-6">
        <h2 className="mb-3 font-bold text-neutral-900">Items to order</h2>
        <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">{item.title}</p>
                <p className="text-sm text-neutral-500">
                  Qty {item.quantity}
                  {item.variant ? ` · ${item.variant}` : ''} · {formatMoney(item.unitPrice, order.currency)} each
                </p>
              </div>
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                >
                  <ExternalLink className="h-4 w-4" /> Order
                </a>
              ) : (
                <span className="text-xs text-neutral-400">No supplier link set</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Totals */}
      <section className="mt-6 rounded-2xl border border-neutral-200 p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Subtotal</dt>
            <dd>{formatMoney(order.subtotal, order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">Shipping charged</dt>
            <dd>{order.shipping === 0 ? 'Free' : formatMoney(order.shipping, order.currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
            <dt>Customer paid</dt>
            <dd>{formatMoney(order.total, order.currency)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
