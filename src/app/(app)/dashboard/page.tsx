'use client';

import { useMemo, useState } from 'react';
import { endOfDay, format, isSameDay, isToday, startOfDay } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, CalendarClock, MapPin, ListPlus } from 'lucide-react';
import { useMode } from '@/context/ModeContext';
import { useToast } from '@/context/ToastContext';
import { useTasks, createTask, updateTask, deleteTask, type Task } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { DaySelector } from '@/components/tasks/DaySelector';
import { QuickAdd } from '@/components/tasks/QuickAdd';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskModal } from '@/components/tasks/TaskModal';
import { CircularProgress } from '@/components/CircularProgress';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const { mode } = useMode();
  const { toast } = useToast();
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [activeTask, setActiveTask] = useState<Task | null | 'new'>(null);

  const from = startOfDay(selected).toISOString();
  const to = endOfDay(selected).toISOString();

  const { tasks, mutate } = useTasks({ mode, from, to });
  const { tasks: overdueAll, mutate: mutateOverdue } = useTasks({ mode, completed: false });
  const { events } = useEvents(mode, from, to);

  const overdue = useMemo(
    () => overdueAll.filter((t) => t.dueAt && new Date(t.dueAt) < startOfDay(new Date()) && !isSameDay(new Date(t.dueAt), selected)),
    [overdueAll, selected]
  );

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }),
    [tasks]
  );

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? completedCount / tasks.length : 0;

  const refresh = () => {
    mutate();
    mutateOverdue();
  };

  const handleQuickAdd = async (title: string, dueAt: Date | null) => {
    try {
      await createTask({
        title,
        mode,
        dueAt: (dueAt ?? selected).toISOString(),
      } as never);
      toast('Task added', 'success');
      refresh();
    } catch {
      toast('Could not add task', 'error');
    }
  };

  const handleSave = async (payload: Record<string, unknown>) => {
    try {
      if (activeTask && activeTask !== 'new') {
        await updateTask(activeTask.id, payload);
        toast('Task updated', 'success');
      } else {
        await createTask(payload as never);
        toast('Task added', 'success');
      }
      refresh();
    } catch {
      toast('Something went wrong', 'error');
    }
  };

  const handleToggle = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateTask(task.id, { completed: !task.completed });
      refresh();
    } catch {
      toast('Could not update task', 'error');
    }
  };

  const handleDelete = async () => {
    if (!activeTask || activeTask === 'new') return;
    try {
      await deleteTask(activeTask.id);
      toast('Task deleted', 'success');
      setActiveTask(null);
      refresh();
    } catch {
      toast('Could not delete task', 'error');
    }
  };

  const handleToggleComplete = async () => {
    if (!activeTask || activeTask === 'new') return;
    await updateTask(activeTask.id, { completed: !activeTask.completed });
    refresh();
    setActiveTask(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {isToday(selected) ? 'Today' : format(selected, 'EEEE')}
          </h1>
          <p className="text-sm text-base-muted">{format(selected, 'MMMM d, yyyy')}</p>
        </div>
        {tasks.length > 0 && (
          <div className="relative flex items-center justify-center">
            <CircularProgress value={progress} />
            <span className="absolute text-xs font-semibold">{Math.round(progress * 100)}%</span>
          </div>
        )}
      </div>

      <div className="mb-5 -mx-4 sm:mx-0">
        <DaySelector selected={selected} onSelect={setSelected} />
      </div>

      <div className="mb-6 flex items-start gap-2">
        <div className="flex-1">
          <QuickAdd fallbackDate={selected} onAdd={handleQuickAdd} />
        </div>
        <button
          onClick={() => setActiveTask('new')}
          title="New task (full form)"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-base-border bg-base-surface text-base-muted transition hover:bg-base-surface2 hover:text-base-text"
        >
          <ListPlus size={18} />
        </button>
      </div>

      {overdue.length > 0 && (
        <Card className="mb-5 border-danger/30 bg-danger/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-danger">
            <AlertTriangle size={16} />
            {overdue.length} overdue task{overdue.length > 1 ? 's' : ''}
          </div>
          <div className="space-y-2">
            {overdue.slice(0, 5).map((t) => (
              <TaskItem key={t.id} task={t} onClick={() => setActiveTask(t)} onToggle={(e) => handleToggle(t, e)} />
            ))}
          </div>
        </Card>
      )}

      {events.length > 0 && (
        <div className="mb-5 space-y-2">
          {events.map((ev) => (
            <div
              key={`${ev.provider}-${ev.id}`}
              className="flex items-center gap-3 rounded-2xl border border-base-border bg-base-surface2/50 p-3.5"
            >
              <CalendarClock size={16} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ev.title}</p>
                <p className="truncate text-xs text-base-muted">
                  {ev.allDay
                    ? 'All day'
                    : `${new Date(ev.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${new Date(
                        ev.end
                      ).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
                  {ev.location ? ` · ${ev.location}` : ''}
                </p>
              </div>
              {ev.location && <MapPin size={14} className="shrink-0 text-base-muted" />}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 pb-4">
        <AnimatePresence initial={false}>
          {sortedTasks.map((task) => (
            <TaskItem key={task.id} task={task} onClick={() => setActiveTask(task)} onToggle={(e) => handleToggle(task, e)} />
          ))}
        </AnimatePresence>

        {sortedTasks.length === 0 && events.length === 0 && overdue.length === 0 && (
          <div className="py-16 text-center text-sm text-base-muted">
            Nothing on the books for this day. Add a task above.
          </div>
        )}
      </div>

      <TaskModal
        open={!!activeTask}
        onClose={() => setActiveTask(null)}
        task={activeTask === 'new' ? null : activeTask}
        defaultDate={selected}
        onSave={handleSave}
        onDelete={activeTask && activeTask !== 'new' ? handleDelete : undefined}
        onToggleComplete={activeTask && activeTask !== 'new' ? handleToggleComplete : undefined}
      />
    </div>
  );
}
