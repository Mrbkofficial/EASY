'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FileCheck2, Settings, Building2, LogOut, ChevronRight, Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/context/ThemeContext';
import { cn, initials } from '@/lib/utils';

export default function MorePage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">More</h1>

      {/* Profile */}
      <Card className="mb-5 flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
          {initials(session?.user?.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{session?.user?.name}</p>
          <p className="truncate text-xs text-base-muted">{session?.user?.email}</p>
        </div>
      </Card>

      <Card className="mb-5 divide-y divide-base-border">
        <NavRow href="/settings" icon={Building2} label="Business profile" />
        <NavRow href="/seai" icon={FileCheck2} label="SEAI grants" />
        <NavRow href="/settings#invoicing" icon={Settings} label="Invoicing settings" />
      </Card>

      {/* Theme */}
      <p className="mb-2 text-sm font-semibold text-base-muted">Appearance</p>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {(
          [
            ['light', Sun, 'Light'],
            ['system', Monitor, 'System'],
            ['dark', Moon, 'Dark'],
          ] as const
        ).map(([t, Icon, label]) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition',
              theme === t ? 'border-accent bg-accent/10 text-accent' : 'border-base-border text-base-muted'
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 text-sm font-medium text-danger"
      >
        <LogOut size={16} /> Sign out
      </button>

      <p className="mt-8 text-center text-xs text-base-muted">TradeMate · Built for Irish trades</p>
    </div>
  );
}

function NavRow({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-base-surface2">
      <Icon size={18} className="text-base-muted" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight size={16} className="text-base-muted" />
    </Link>
  );
}
