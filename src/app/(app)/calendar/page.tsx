'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMode } from '@/context/ModeContext';
import { useToast } from '@/context/ToastContext';
import { useTasks, createTask, updateTask, deleteTask, type Task } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useConnections } from '@/hooks/useConnections';
import { Button } from '@/components/ui/Button';
import { TaskModal } from '@/components/tasks/TaskModal';
import { EventModal } from '@/components/calendar/EventModal';
import { cn } from '@/lib/utils';
import type { UnifiedEvent } from '@/types';

export default function CalendarPage() {
  const { mode } = useMode();
  const { toast } = useToast();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [activeTask, setActiveTask] = useState<Task | null | 'new'>(null);
  const [activeEvent, setActiveEvent] = useState<UnifiedEvent | null | 'new'>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const { connections } = useConnections();
  const availableProviders = [
    ...(connections.google ? (['google'] as const) : []),
    ...(connections.microsoft ? (['outlook'] as const) : []),
  ];

  const { tasks, mutate: mutateTasks } = useTasks({ mode, from: gridStart.toISOString(), to: gridEnd.toISOString() });
  const { events, mutate: mutateEvents } = useEvents(mode, gridStart.toISOString(), gridEnd.toISOString());

  const itemsByDay = useMemo(() => {
    const map = new Map<string, { tasks: Task[]; events: UnifiedEvent[] }>();
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const key = format(new Date(t.dueAt), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, { tasks: [], events: [] });
      map.get(key)!.tasks.push(t);
    }
    for (const e of events) {
      const key = format(new Date(e.start), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, { tasks: [], events: [] });
      map.get(key)!.events.push(e);
    }
    return map;
  }, [tasks, events]);

  const selectedKey = format(selectedDay, 'yyyy-MM-dd');
  const selectedItems = itemsByDay.get(selectedKey) ?? { tasks: [], events: [] };

  const refresh = () => {
    mutateTasks();
    mutateEvents();
  };

  const handleSaveEvent = async (payload: {
    provider: 'google' | 'outlook';
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    location?: string;
    description?: string;
  }) => {
    try {
      if (activeEvent && activeEvent !== 'new') {
        await fetch(`/api/calendar/events/${activeEvent.provider}/${activeEvent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Event updated', 'success');
      } else {
        await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Event created', 'success');
      }
      refresh();
    } catch {
      toast('Could not save event', 'error');
    }
  };

  const handleDeleteEvent = async () => {
    if (!activeEvent || activeEvent === 'new') return;
    try {
      await fetch(`/api/calendar/events/${activeEvent.provider}/${activeEvent.id}`, { method: 'DELETE' });
      toast('Event deleted', 'success');
      setActiveEvent(null);
      refresh();
    } catch {
      toast('Could not delete event', 'error');
    }
  };

  const handleSaveTask = async (payload: Record<string, unknown>) => {
    try {
      if (activeTask && activeTask !== 'new') {
        await updateTask(activeTask.id, payload);
      } else {
        await createTask(payload as never);
      }
      toast('Saved', 'success');
      refresh();
    } catch {
      toast('Something went wrong', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{format(cursor, 'MMMM yyyy')}</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => subMonths(c, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-base-muted">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const items = itemsByDay.get(key);
          const count = (items?.tasks.length ?? 0) + (items?.events.length ?? 0);
          const inMonth = isSameMonth(day, cursor);
          const selected = isSameDay(day, selectedDay);
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition-colors',
                selected ? 'bg-accent text-accent-fg' : 'hover:bg-base-surface2',
                !inMonth && !selected && 'text-base-muted/40',
                isToday(day) && !selected && 'font-semibold text-accent'
              )}
            >
              {format(day, 'd')}
              {count > 0 && (
                <span className={cn('h-1 w-1 rounded-full', selected ? 'bg-accent-fg' : 'bg-accent')} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-muted">{format(selectedDay, 'EEEE, MMMM d')}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setActiveTask('new')}>
            <Plus size={14} className="mr-1" />
            Task
          </Button>
          {availableProviders.length > 0 && (
            <Button size="sm" onClick={() => setActiveEvent('new')}>
              <Plus size={14} className="mr-1" />
              Event
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 pb-8">
        {selectedItems.events.map((ev) => (
          <button
            key={`${ev.provider}-${ev.id}`}
            onClick={() => setActiveEvent(ev)}
            className="flex w-full items-center gap-3 rounded-2xl border border-base-border bg-base-surface2/50 p-3.5 text-left"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ev.title}</p>
              <p className="text-xs text-base-muted">
                {ev.allDay ? 'All day' : `${format(new Date(ev.start), 'h:mm a')} – ${format(new Date(ev.end), 'h:mm a')}`}
              </p>
            </div>
            <span className="rounded-full bg-base-surface px-2 py-0.5 text-[10px] uppercase text-base-muted">
              {ev.provider}
            </span>
          </button>
        ))}

        {selectedItems.tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTask(t)}
            className="flex w-full items-center gap-3 rounded-2xl border border-base-border bg-base-surface p-3.5 text-left"
          >
            <span className={cn('h-2 w-2 shrink-0 rounded-full', t.completed ? 'bg-success' : 'bg-warning')} />
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm font-medium', t.completed && 'text-base-muted line-through')}>
                {t.title}
              </p>
              {t.dueAt && <p className="text-xs text-base-muted">{format(new Date(t.dueAt), 'h:mm a')}</p>}
            </div>
          </button>
        ))}

        {selectedItems.events.length === 0 && selectedItems.tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-base-muted">Nothing scheduled this day.</p>
        )}
      </div>

      <TaskModal
        open={!!activeTask}
        onClose={() => setActiveTask(null)}
        task={activeTask === 'new' ? null : activeTask}
        defaultDate={selectedDay}
        onSave={handleSaveTask}
        onDelete={
          activeTask && activeTask !== 'new'
            ? async () => {
                await deleteTask(activeTask.id);
                setActiveTask(null);
                refresh();
              }
            : undefined
        }
        onToggleComplete={
          activeTask && activeTask !== 'new'
            ? async () => {
                await updateTask(activeTask.id, { completed: !activeTask.completed });
                refresh();
                setActiveTask(null);
              }
            : undefined
        }
      />

      <EventModal
        open={!!activeEvent}
        onClose={() => setActiveEvent(null)}
        event={activeEvent === 'new' ? null : activeEvent}
        defaultDate={selectedDay}
        availableProviders={availableProviders}
        onSave={handleSaveEvent}
        onDelete={activeEvent && activeEvent !== 'new' ? handleDeleteEvent : undefined}
      />
    </div>
  );
}
