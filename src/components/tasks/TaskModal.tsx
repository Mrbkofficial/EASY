'use client';

import { useEffect, useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Label } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useMode } from '@/context/ModeContext';
import type { Task } from '@/hooks/useTasks';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultDate?: Date;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onToggleComplete?: () => Promise<void>;
}

const REMINDER_OPTIONS = [
  { label: 'At due time', value: 0 },
  { label: '10 min before', value: 10 },
  { label: '30 min before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
];

function toLocalInput(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskModal({ open, onClose, task, defaultDate, onSave, onDelete, onToggleComplete }: TaskModalProps) {
  const { mode } = useMode();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [category, setCategory] = useState('');
  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('NONE');
  const [reminders, setReminders] = useState<number[]>([30]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? '');
      setDueAt(toLocalInput(task.dueAt));
      setPriority(task.priority);
      setCategory(task.category ?? '');
      setRecurrence(task.recurrence);
      setReminders(task.reminderOffsets ?? []);
    } else {
      setTitle('');
      setNotes('');
      setDueAt(defaultDate ? toLocalInput(defaultDate.toISOString()) : '');
      setPriority('MEDIUM');
      setCategory('');
      setRecurrence('NONE');
      setReminders([30]);
    }
  }, [open, task, defaultDate]);

  const toggleReminder = (value: number) => {
    setReminders((r) => (r.includes(value) ? r.filter((v) => v !== value) : [...r, value].sort((a, b) => a - b)));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        notes: notes.trim() || null,
        mode: task?.mode ?? mode,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        priority,
        category: category.trim() || null,
        recurrence,
        reminderOffsets: reminders,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to get done?"
          />
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add details…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Due date &amp; time</Label>
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Errands" />
          </div>
          <div>
            <Label>Repeat</Label>
            <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}>
              <option value="NONE">Doesn&apos;t repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </Select>
          </div>
        </div>

        {dueAt && (
          <div>
            <Label>Remind me</Label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReminder(opt.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    reminders.includes(opt.value)
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-base-border text-base-muted hover:bg-base-surface2'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            {task && onDelete && (
              <Button variant="danger" size="icon" onClick={onDelete} title="Delete task">
                <Trash2 size={16} />
              </Button>
            )}
            {task && onToggleComplete && (
              <Button variant={task.completed ? 'secondary' : 'outline'} size="md" onClick={onToggleComplete}>
                <Check size={16} className="mr-1.5" />
                {task.completed ? 'Completed' : 'Mark complete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
