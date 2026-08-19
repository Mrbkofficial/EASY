'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, MapPin, MessageCircle, Pencil, Trash2, Wrench, ReceiptEuro, type LucideIcon } from 'lucide-react';
import { useCustomer } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner, StatusBadge } from '@/components/ui/Bits';
import { CustomerModal } from '@/components/forms/CustomerModal';
import { JobModal } from '@/components/forms/JobModal';
import { apiDelete } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { whatsappLink } from '@/lib/whatsapp';
import { formatCurrency, formatDate } from '@/lib/utils';
import { JOB_STATUS, INVOICE_STATUS, labelForTrade } from '@/lib/trades';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { customer, isLoading, mutate } = useCustomer(id);
  const [editOpen, setEditOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);

  if (isLoading) return <Spinner />;
  if (!customer)
    return (
      <div className="py-16 text-center text-base-muted">
        Customer not found. <Link href="/customers" className="text-accent">Back to customers</Link>
      </div>
    );

  async function remove() {
    if (!confirm('Delete this customer and all their jobs, quotes and invoices?')) return;
    try {
      await apiDelete(`/api/customers/${id}`);
      toast('Customer deleted', 'success');
      router.push('/customers');
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  return (
    <div>
      <Link href="/customers" className="mb-3 inline-flex items-center gap-1 text-sm text-base-muted">
        <ArrowLeft size={16} /> Customers
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          {customer.address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-base-muted">
              <MapPin size={13} /> {customer.address} {customer.eircode}
            </p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}>
          <Pencil size={16} />
        </Button>
      </div>

      {/* Contact actions */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <ContactButton
          disabled={!customer.phone}
          href={customer.phone ? `tel:${customer.phone}` : undefined}
          icon={Phone}
          label="Call"
        />
        <ContactButton
          disabled={!customer.phone}
          href={customer.phone ? whatsappLink(customer.phone, `Hi ${customer.name}, `) : undefined}
          icon={MessageCircle}
          label="WhatsApp"
          external
        />
        <ContactButton
          disabled={!customer.email}
          href={customer.email ? `mailto:${customer.email}` : undefined}
          icon={Mail}
          label="Email"
        />
      </div>

      {customer.notes && (
        <Card className="mb-5 p-4 text-sm text-base-muted">{customer.notes}</Card>
      )}

      {/* Jobs */}
      <Section title="Jobs" count={customer.jobs.length} action={<button onClick={() => setJobOpen(true)} className="text-xs font-medium text-accent">+ New job</button>}>
        {customer.jobs.length === 0 ? (
          <p className="px-4 py-3 text-sm text-base-muted">No jobs yet.</p>
        ) : (
          customer.jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
              <Wrench size={15} className="shrink-0 text-base-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="text-xs text-base-muted">{labelForTrade(job.trade)}</p>
              </div>
              <StatusBadge {...JOB_STATUS[job.status]} />
            </Link>
          ))
        )}
      </Section>

      {/* Invoices */}
      <Section title="Invoices" count={customer.invoices.length}>
        {customer.invoices.length === 0 ? (
          <p className="px-4 py-3 text-sm text-base-muted">No invoices yet.</p>
        ) : (
          customer.invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
              <ReceiptEuro size={15} className="shrink-0 text-base-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{inv.number}</p>
                <p className="text-xs text-base-muted">{formatDate(inv.issueDate)}</p>
              </div>
              <span className="text-sm font-medium">{formatCurrency(inv.total)}</span>
              <StatusBadge {...INVOICE_STATUS[inv.status]} />
            </Link>
          ))
        )}
      </Section>

      <button onClick={remove} className="mt-6 flex items-center gap-2 text-sm text-danger">
        <Trash2 size={15} /> Delete customer
      </button>

      <CustomerModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => mutate()} customer={customer} />
      <JobModal open={jobOpen} onClose={() => setJobOpen(false)} onSaved={() => mutate()} defaultCustomerId={customer.id} />
    </div>
  );
}

function ContactButton({
  href,
  icon: Icon,
  label,
  disabled,
  external,
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  external?: boolean;
}) {
  const base =
    'flex flex-col items-center gap-1 rounded-xl border border-base-border py-3 text-xs font-medium transition';
  if (disabled || !href)
    return (
      <div className={`${base} cursor-not-allowed text-base-muted opacity-50`}>
        <Icon size={18} />
        {label}
      </div>
    );
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`${base} text-base-text hover:bg-base-surface2`}
    >
      <Icon size={18} className="text-accent" />
      {label}
    </a>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-muted">
          {title} <span className="text-base-muted/60">({count})</span>
        </h2>
        {action}
      </div>
      <Card className="divide-y divide-base-border">{children}</Card>
    </div>
  );
}
