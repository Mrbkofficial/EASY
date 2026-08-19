'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, ChevronRight, Calendar } from 'lucide-react';
import { useJobs } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { PageHeader, EmptyState, Spinner, Fab, StatusBadge } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { JobModal } from '@/components/forms/JobModal';
import { JOB_STATUS, labelForTrade, type JobStatusKey } from '@/lib/trades';
import { cn, formatDate } from '@/lib/utils';

const FILTERS: { key: JobStatusKey | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'LEAD', label: 'Leads' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'INVOICED', label: 'Invoiced' },
];

export default function JobsPage() {
  const [filter, setFilter] = useState<JobStatusKey | 'ALL'>('ALL');
  const { jobs, isLoading, mutate } = useJobs(filter === 'ALL' ? {} : { status: filter });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Jobs" subtitle="Your work pipeline" />

      <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
              filter === f.key ? 'bg-accent text-accent-fg' : 'bg-base-surface2 text-base-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No jobs here"
          description="Create a job to track work, then attach quotes, invoices and SEAI docs to it."
          action={<Button onClick={() => setModalOpen(true)}>New job</Button>}
        />
      ) : (
        <Card className="divide-y divide-base-border">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="truncate text-xs text-base-muted">
                  {job.customer?.name} · {labelForTrade(job.trade)}
                  {job.scheduledFor && (
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      · <Calendar size={10} /> {formatDate(job.scheduledFor)}
                    </span>
                  )}
                </p>
              </div>
              <StatusBadge {...JOB_STATUS[job.status]} />
              <ChevronRight size={16} className="text-base-muted" />
            </Link>
          ))}
        </Card>
      )}

      <Fab label="Job" onClick={() => setModalOpen(true)} />
      <JobModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => mutate()} />
    </div>
  );
}
