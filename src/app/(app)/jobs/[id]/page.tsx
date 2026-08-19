'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, MapPin, Calendar, User, FileText, ReceiptEuro,
  FileCheck2, Plus, ChevronRight,
} from 'lucide-react';
import { useJob } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner, StatusBadge, Field } from '@/components/ui/Bits';
import { JobModal } from '@/components/forms/JobModal';
import { NewDocumentModal } from '@/components/forms/NewDocumentModal';
import { apiDelete, apiPost, apiPatch } from '@/lib/client';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { JOB_STATUS, QUOTE_STATUS, INVOICE_STATUS, SEAI_GRANTS, labelForTrade } from '@/lib/trades';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { job, isLoading, mutate } = useJob(id);
  const [editOpen, setEditOpen] = useState(false);
  const [newQuote, setNewQuote] = useState(false);
  const [newInvoice, setNewInvoice] = useState(false);
  const [seaiOpen, setSeaiOpen] = useState(false);
  const [grantType, setGrantType] = useState('ATTIC_INSULATION');
  const [creatingSeai, setCreatingSeai] = useState(false);

  if (isLoading) return <Spinner />;
  if (!job)
    return (
      <div className="py-16 text-center text-base-muted">
        Job not found. <Link href="/jobs" className="text-accent">Back to jobs</Link>
      </div>
    );

  async function updateStatus(status: string) {
    try {
      await apiPatch(`/api/jobs/${id}`, { status });
      mutate();
    } catch {
      toast('Failed to update status', 'error');
    }
  }

  async function createSeai() {
    setCreatingSeai(true);
    try {
      const res = await apiPost<{ project: { id: string } }>('/api/seai', { jobId: id, grantType });
      toast('SEAI workflow started', 'success');
      router.push(`/seai/${res.project.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to start', 'error');
      setCreatingSeai(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this job and its SEAI documentation?')) return;
    try {
      await apiDelete(`/api/jobs/${id}`);
      toast('Job deleted', 'success');
      router.push('/jobs');
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  return (
    <div>
      <Link href="/jobs" className="mb-3 inline-flex items-center gap-1 text-sm text-base-muted">
        <ArrowLeft size={16} /> Jobs
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-0.5 text-sm text-base-muted">{labelForTrade(job.trade)}</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}>
          <Pencil size={16} />
        </Button>
      </div>

      <Card className="mb-5 divide-y divide-base-border">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-base-muted">Status</span>
          <Select
            className="w-auto text-xs"
            value={job.status}
            onChange={(e) => updateStatus(e.target.value)}
          >
            {Object.entries(JOB_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        <Link href={`/customers/${job.customerId}`} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-base-surface2">
          <User size={15} className="text-base-muted" />
          <span className="flex-1">{job.customer?.name}</span>
          <ChevronRight size={15} className="text-base-muted" />
        </Link>
        {(job.address || job.customer?.address) && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm">
            <MapPin size={15} className="text-base-muted" />
            {job.address || job.customer?.address} {job.eircode || job.customer?.eircode}
          </div>
        )}
        {job.scheduledFor && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm">
            <Calendar size={15} className="text-base-muted" />
            {formatDate(job.scheduledFor)}
          </div>
        )}
      </Card>

      {job.description && (
        <Card className="mb-5 p-4 text-sm">
          <p className="mb-1 text-xs font-semibold text-base-muted">Scope of works</p>
          {job.description}
        </Card>
      )}

      {/* Quotes */}
      <SectionHeader title="Quotes" onAdd={() => setNewQuote(true)} />
      <Card className="mb-5 divide-y divide-base-border">
        {job.quotes.length === 0 ? (
          <p className="px-4 py-3 text-sm text-base-muted">No quotes for this job.</p>
        ) : (
          job.quotes.map((q) => (
            <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
              <FileText size={15} className="text-base-muted" />
              <span className="flex-1 text-sm font-medium">{q.number}</span>
              <span className="text-sm">{formatCurrency(q.total)}</span>
              <StatusBadge {...QUOTE_STATUS[q.status]} />
            </Link>
          ))
        )}
      </Card>

      {/* Invoices */}
      <SectionHeader title="Invoices" onAdd={() => setNewInvoice(true)} />
      <Card className="mb-5 divide-y divide-base-border">
        {job.invoices.length === 0 ? (
          <p className="px-4 py-3 text-sm text-base-muted">No invoices for this job.</p>
        ) : (
          job.invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
              <ReceiptEuro size={15} className="text-base-muted" />
              <span className="flex-1 text-sm font-medium">{inv.number}</span>
              <span className="text-sm">{formatCurrency(inv.total)}</span>
              <StatusBadge {...INVOICE_STATUS[inv.status]} />
            </Link>
          ))
        )}
      </Card>

      {/* SEAI */}
      <h2 className="mb-2 text-sm font-semibold text-base-muted">SEAI grant</h2>
      {job.seaiProject ? (
        <Link href={`/seai/${job.seaiProject.id}`}>
          <Card className="mb-5 flex items-center gap-3 p-4 hover:bg-base-surface2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FileCheck2 size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{SEAI_GRANTS[job.seaiProject.grantType]?.label ?? 'SEAI project'}</p>
              <p className="text-xs text-base-muted">
                {job.seaiProject.checklist.filter((c) => c.done).length}/{job.seaiProject.checklist.length} steps done
              </p>
            </div>
            <ChevronRight size={16} className="text-base-muted" />
          </Card>
        </Link>
      ) : (
        <Card className="mb-5 p-4">
          <p className="mb-3 text-sm text-base-muted">
            Track BER certs, photos and the Declaration of Works for a SEAI grant on this job.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSeaiOpen(true)}>
            <Plus size={16} /> Start SEAI workflow
          </Button>
        </Card>
      )}

      <button onClick={remove} className="mt-2 flex items-center gap-2 text-sm text-danger">
        <Trash2 size={15} /> Delete job
      </button>

      <JobModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => mutate()} job={job} />
      <NewDocumentModal
        open={newQuote}
        onClose={() => setNewQuote(false)}
        kind="quote"
        defaultCustomerId={job.customerId}
        defaultJobId={job.id}
      />
      <NewDocumentModal
        open={newInvoice}
        onClose={() => setNewInvoice(false)}
        kind="invoice"
        defaultCustomerId={job.customerId}
        defaultJobId={job.id}
      />

      <Modal open={seaiOpen} onClose={() => setSeaiOpen(false)} title="Start SEAI workflow">
        <div className="space-y-4">
          <Field label="Grant / measure type">
            <Select value={grantType} onChange={(e) => setGrantType(e.target.value)}>
              {Object.entries(SEAI_GRANTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-base-muted">
            We&apos;ll pre-load the standard evidence checklist for this measure. You can tick items off and attach photos as you go.
          </p>
          <Button className="w-full" onClick={createSeai} disabled={creatingSeai}>
            Create workflow
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-base-muted">{title}</h2>
      <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-accent">
        <Plus size={14} /> New
      </button>
    </div>
  );
}
