'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Wrench, Users, FileText, ReceiptEuro, AlertTriangle, TrendingUp, FileCheck2, ChevronRight, type LucideIcon } from 'lucide-react';
import { useStats } from '@/hooks/useData';
import { Card } from '@/components/ui/Card';
import { Spinner, StatusBadge } from '@/components/ui/Bits';
import { formatCurrency } from '@/lib/utils';
import { JOB_STATUS, labelForTrade } from '@/lib/trades';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { stats, isLoading } = useStats();

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-base-muted">Welcome back,</p>
        <h1 className="text-2xl font-semibold tracking-tight">{firstName}</h1>
      </div>

      {isLoading || !stats ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          {/* Money row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="min-w-0 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-base-muted">
                <TrendingUp size={14} className="shrink-0" /> <span className="truncate">Paid this month</span>
              </div>
              <p className="truncate text-2xl font-semibold text-success">{formatCurrency(stats.paidThisMonth)}</p>
            </Card>
            <Card className="min-w-0 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-base-muted">
                <ReceiptEuro size={14} className="shrink-0" /> <span className="truncate">Outstanding</span>
              </div>
              <p className="truncate text-2xl font-semibold">{formatCurrency(stats.outstanding)}</p>
              {stats.overdue > 0 && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-danger">
                  <AlertTriangle size={12} className="shrink-0" /> {formatCurrency(stats.overdue)} overdue
                </p>
              )}
            </Card>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatTile href="/jobs" icon={Wrench} value={stats.activeJobs} label="Active jobs" />
            <StatTile href="/billing?tab=quotes" icon={FileText} value={stats.pendingQuotes} label="Quotes" />
            <StatTile href="/customers" icon={Users} value={stats.customerCount} label="Customers" />
            <StatTile href="/seai" icon={FileCheck2} value={stats.seaiOpen} label="SEAI" />
          </div>

          {/* Recent jobs */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-base-muted">Recent jobs</h2>
              <Link href="/jobs" className="text-xs font-medium text-accent">
                View all
              </Link>
            </div>
            {stats.recentJobs.length === 0 ? (
              <Card className="p-5 text-center text-sm text-base-muted">
                No jobs yet.{' '}
                <Link href="/jobs" className="font-medium text-accent">
                  Create your first job
                </Link>
                .
              </Card>
            ) : (
              <Card className="divide-y divide-base-border">
                {stats.recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-base-surface2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="truncate text-xs text-base-muted">
                        {job.customer.name} · {labelForTrade(job.trade)}
                      </p>
                    </div>
                    <StatusBadge {...JOB_STATUS[job.status]} />
                    <ChevronRight size={16} className="text-base-muted" />
                  </Link>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  href,
  icon: Icon,
  value,
  label,
}: {
  href: string;
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <Link href={href} className="min-w-0">
      <Card className="flex min-w-0 flex-col items-center gap-1 px-1 py-3 text-center transition hover:bg-base-surface2">
        <Icon size={18} className="text-accent" />
        <span className="text-lg font-semibold leading-none">{value}</span>
        <span className="w-full truncate text-[10px] leading-tight text-base-muted">{label}</span>
      </Card>
    </Link>
  );
}
