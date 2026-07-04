'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label, Textarea } from '@/components/ui/Input';
import type { UnifiedEvent } from '@/types';

function toLocalInput(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event?: UnifiedEvent | null;
  defaultDate?: Date;
  availableProviders: ('google' | 'outlook')[];
  onSave: (payload: {
    provider: 'google' | 'outlook';
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    location?: string;
    description?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EventModal({ open, onClose, event, defaultDate, availableProviders, onSave, onDelete }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState<'google' | 'outlook'>(availableProviders[0] ?? 'google');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setProvider(event.provider);
      setStart(toLocalInput(event.start));
      setEnd(toLocalInput(event.end));
      setLocation(event.location ?? '');
      setDescription(event.description ?? '');
    } else {
      const base = defaultDate ?? new Date();
      const startD = new Date(base);
      startD.setMinutes(0, 0, 0);
      startD.setHours(startD.getHours() + 1);
      const endD = new Date(startD);
      endD.setHours(endD.getHours() + 1);
      setTitle('');
      setProvider(availableProviders[0] ?? 'google');
      setStart(toLocalInput(startD.toISOString()));
      setEnd(toLocalInput(endD.toISOString()));
      setLocation('');
      setDescription('');
    }
  }, [open, event, defaultDate, availableProviders]);

  const handleSave = async () => {
    if (!title.trim() || !start || !end) return;
    setSaving(true);
    try {
      await onSave({
        provider,
        title: title.trim(),
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay: false,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Edit event' : 'New event'}>
      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
        </div>

        {!event && availableProviders.length > 1 && (
          <div>
            <Label>Calendar</Label>
            <Select value={provider} onChange={(e) => setProvider(e.target.value as 'google' | 'outlook')}>
              {availableProviders.includes('google') && <option value="google">Google Calendar</option>}
              {availableProviders.includes('outlook') && <option value="outlook">Outlook Calendar</option>}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Starts</Label>
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>Ends</Label>
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          {event && onDelete ? (
            <Button variant="danger" size="icon" onClick={onDelete}>
              <Trash2 size={16} />
            </Button>
          ) : (
            <span />
          )}
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
