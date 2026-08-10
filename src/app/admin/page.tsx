import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/utils';
import { storeConfig } from '@/lib/store.config';
import { PackageCheck, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  FULFILLED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-neutral-100 text-neutral-500',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-amber-100 text-amber-700',
};

export default async function AdminOrders() {
  if (!isAdmin()) redirect('/admin/login');

  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let dbError = false;
  try {
    // Only paid+ orders matter for fulfilment; hide abandoned PENDING carts.
    orders = await prisma.order.findMany({
      where: { status: { not: 'PENDING' } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  } catch {
    dbError = true;
  }

  const unfulfilled = orders.filter((o) => !o.fulfilled && o.status === 'PAID').length;

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {unfulfilled > 0 ? `${unfulfilled} awaiting fulfilment` : 'All caught up'} · {storeConfig.name}
          </p>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button className="text-sm text-neutral-500 hover:text-brand-700">Sign out</button>
        </form>
      </div>

      {dbError ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not reach the database. Make sure <code>DATABASE_URL</code> is set and{' '}
          <code>npx prisma db push</code> has been run.
        </p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-neutral-500">No orders yet. They&apos;ll appear here the moment a sale comes in.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fulfilment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(o.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{o.name}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(o.total, o.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.fulfilled ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-700">
                        <PackageCheck className="h-4 w-4" /> Placed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="h-4 w-4" /> To do
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
