'use client';

import { useEffect, useRef } from 'react';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

export function DaySelector({
  selected,
  onSelect,
  rangeDays = 30,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
  rangeDays?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const today = startOfDay(new Date());
  const days = Array.from({ length: rangeDays }, (_, i) => addDays(today, i - 7));

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  return (
    <div ref={containerRef} className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-1 sm:px-0">
      {days.map((day) => {
        const active = isSameDay(day, selected);
        const isToday = isSameDay(day, today);
        return (
          <button
            key={day.toISOString()}
            ref={active ? activeRef : undefined}
            onClick={() => onSelect(day)}
            className={cn(
              'flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3.5 py-2 text-center transition-colors',
              active ? 'bg-accent text-accent-fg' : 'bg-base-surface2 text-base-text hover:bg-base-border/50'
            )}
          >
            <span className={cn('text-[10px] font-medium uppercase', active ? 'opacity-80' : 'text-base-muted')}>
              {format(day, 'EEE')}
            </span>
            <span className="text-base font-semibold">{format(day, 'd')}</span>
            {isToday && (
              <span className={cn('h-1 w-1 rounded-full', active ? 'bg-accent-fg' : 'bg-accent')} />
            )}
          </button>
        );
      })}
    </div>
  );
}
