'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Search, Phone, ChevronRight } from 'lucide-react';
import { useCustomers } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader, EmptyState, Spinner, Fab } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { CustomerModal } from '@/components/forms/CustomerModal';

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const { customers, isLoading, mutate } = useCustomers(q);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Your client book" />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted" />
        <Input
          className="pl-9"
          placeholder="Search name, phone, address…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? 'No matches' : 'No customers yet'}
          description={q ? 'Try a different search.' : 'Add your first customer to start creating jobs and quotes.'}
          action={!q && <Button onClick={() => setModalOpen(true)}>Add customer</Button>}
        />
      ) : (
        <Card className="divide-y divide-base-border">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-base-surface2"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                {c.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-base-muted">
                  {c.phone ? (
                    <>
                      <Phone size={11} /> {c.phone}
                    </>
                  ) : (
                    c.address || 'No contact details'
                  )}
                </p>
              </div>
              <span className="text-xs text-base-muted">{c._count?.jobs ?? 0} jobs</span>
              <ChevronRight size={16} className="text-base-muted" />
            </Link>
          ))}
        </Card>
      )}

      <Fab label="Customer" onClick={() => setModalOpen(true)} />
      <CustomerModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => mutate()} />
    </div>
  );
}
