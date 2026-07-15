'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Mail, Wallet, PenTool, Settings, Sparkles } from 'lucide-react';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { UserMenu } from '@/components/UserMenu';
import { cn } from '@/lib/utils';
import { PushRegister } from '@/components/PushRegister';

const NAV = [
  { href: '/dashboard', label: 'Today', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/mail', label: 'Mail', icon: Mail },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/cad', label: 'CAD', icon: PenTool },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh w-full">
      <PushRegister />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-base-border bg-base-surface px-4 py-6 sm:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <Sparkles size={16} />
          </div>
          <span className="text-lg font-semibold">Easy</span>
        </div>
        <div className="mb-6">
          <ModeSwitcher />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-accent/10 text-accent' : 'text-base-muted hover:bg-base-surface2 hover:text-base-text'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <UserMenu />
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-base-border bg-base-bg/80 px-4 py-3 backdrop-blur-lg sm:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <Sparkles size={14} />
            </div>
            <span className="font-semibold">Easy</span>
          </div>
          <ModeSwitcher />
        </header>

        <main className="flex-1 pb-24 sm:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-base-border bg-base-surface/95 px-2 py-2 backdrop-blur-lg sm:hidden">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors',
                  active ? 'text-accent' : 'text-base-muted'
                )}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
