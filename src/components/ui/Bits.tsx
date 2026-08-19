'use client';

import Link from 'next/link';
import { Plus, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', color)}>
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-base-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-base-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-border px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-base-surface2 text-base-muted">
        <Icon size={22} />
      </div>
      <p className="font-medium text-base-text">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-base-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Floating action button for mobile-first "add" actions.
export function Fab({ onClick, label = 'Add', href }: { onClick?: () => void; label?: string; href?: string }) {
  const className =
    'fixed bottom-24 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-accent-fg shadow-soft transition active:scale-95 sm:bottom-8';
  const content = (
    <>
      <Plus size={20} />
      <span className="font-medium">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-base-border border-t-accent" />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-base-muted">{label}</label>
      {children}
    </div>
  );
}
