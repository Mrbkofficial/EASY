'use client';

import Link from 'next/link';
import { FileCheck2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useSeaiProjects } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { EmptyState, Spinner, StatusBadge } from '@/components/ui/Bits';
import { SEAI_GRANTS } from '@/lib/trades';

export default function SeaiPage() {
  const { projects, isLoading } = useSeaiProjects();

  return (
    <div>
      <Link href="/more" className="mb-3 inline-flex items-center gap-1 text-sm text-base-muted">
        <ArrowLeft size={16} /> More
      </Link>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">SEAI grants</h1>
        <p className="mt-0.5 text-sm text-base-muted">Grant documentation workflows</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No SEAI projects yet"
          description="Open a job (insulation, heat pump, solar…) and start a SEAI workflow to track grant evidence here."
        />
      ) : (
        <Card className="divide-y divide-base-border">
          {projects.map((p) => {
            const done = p.checklist.filter((c) => c.done).length;
            return (
              <Link key={p.id} href={`/seai/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-surface2">
                <FileCheck2 size={16} className="shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{SEAI_GRANTS[p.grantType]?.label ?? p.grantType}</p>
                  <p className="truncate text-xs text-base-muted">
                    {p.job?.customer?.name} · {done}/{p.checklist.length} steps · {p._count?.documents ?? 0} docs
                  </p>
                </div>
                {p.approved ? (
                  <StatusBadge label="Approved" color="bg-teal-500/15 text-teal-500" />
                ) : p.submitted ? (
                  <StatusBadge label="Submitted" color="bg-blue-500/15 text-blue-500" />
                ) : (
                  <StatusBadge label="In progress" color="bg-amber-500/15 text-amber-500" />
                )}
                <ChevronRight size={16} className="text-base-muted" />
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
