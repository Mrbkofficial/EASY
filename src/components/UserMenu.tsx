'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { initials, cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

export function UserMenu() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  return (
    <div className="relative mt-2">
      {open && (
        <div className="absolute bottom-14 left-0 w-full rounded-2xl border border-base-border bg-base-surface p-1.5 shadow-soft animate-slide-up">
          <div className="flex items-center gap-1 p-1">
            {(
              [
                ['light', Sun],
                ['system', Monitor],
                ['dark', Moon],
              ] as const
            ).map(([t, Icon]) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-lg py-1.5 text-base-muted hover:bg-base-surface2',
                  theme === t && 'bg-accent/10 text-accent'
                )}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-danger hover:bg-danger/10"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-base-surface2"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
            {initials(session.user.name)}
          </div>
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-base-muted">{session.user.email}</p>
        </div>
      </button>
    </div>
  );
}
