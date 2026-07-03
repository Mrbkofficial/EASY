'use client';

import { motion } from 'framer-motion';
import { Briefcase, User } from 'lucide-react';
import { useMode } from '@/context/ModeContext';
import { cn } from '@/lib/utils';

export function ModeSwitcher() {
  const { mode, setMode } = useMode();

  return (
    <div className="relative flex items-center rounded-full border border-base-border bg-base-surface2 p-1 text-sm">
      {(['PERSONAL', 'WORK'] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-colors',
              active ? 'text-accent-fg' : 'text-base-muted hover:text-base-text'
            )}
          >
            {m === 'PERSONAL' ? <User size={14} /> : <Briefcase size={14} />}
            {m === 'PERSONAL' ? 'Personal' : 'Work'}
            {active && (
              <motion.div
                layoutId="mode-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 -z-10 rounded-full bg-accent"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
