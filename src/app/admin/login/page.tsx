import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { Lock } from 'lucide-react';
import { storeConfig } from '@/lib/store.config';

export const dynamic = 'force-dynamic';

export default function AdminLogin({ searchParams }: { searchParams: { error?: string } }) {
  if (isAdmin()) redirect('/admin');

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-24">
      <Lock className="h-10 w-10 text-brand-600" />
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">{storeConfig.name} admin</h1>
      <p className="mt-1 text-sm text-neutral-500">Owner access only.</p>

      {searchParams.error && (
        <p className="mt-4 w-full rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          Incorrect password.
        </p>
      )}

      <form action="/api/admin/login" method="POST" className="mt-6 w-full space-y-4">
        <input
          type="password"
          name="password"
          placeholder="Admin password"
          autoFocus
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
