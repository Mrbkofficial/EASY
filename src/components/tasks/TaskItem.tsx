'use client';

import { motion } from 'framer-motion';
import { Check, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/hooks/useTasks';

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  LOW: 'bg-base-muted',
  MEDIUM: 'bg-warning',
  HIGH: 'bg-danger',
};

export function TaskItem({
  task,
  onClick,
  onToggle,
}: {
  task: Task;
  onClick: () => void;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const time = task.dueAt
    ? new Date(task.dueAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <motion.button
      layout
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full items-center gap-3 rounded-2xl border border-base-border bg-base-surface p-3.5 text-left shadow-card transition hover:border-accent/40"
    >
      <button
        onClick={onToggle}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          task.completed ? 'border-accent bg-accent text-accent-fg' : 'border-base-border hover:border-accent'
        )}
      >
        {task.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_COLOR[task.priority])} />

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', task.completed && 'text-base-muted line-through')}>
          {task.title}
        </p>
        {(task.category || time) && (
          <p className="mt-0.5 truncate text-xs text-base-muted">
            {[time, task.category].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {task.recurrence !== 'NONE' && <Repeat size={14} className="shrink-0 text-base-muted" />}
    </motion.button>
  );
}
