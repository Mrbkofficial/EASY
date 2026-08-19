'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Wrench, ReceiptEuro, Menu, HardHat } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { cn } from '@/lib/utils';
import { PushRegister } from '@/components/PushRegister';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/jobs', label: 'Jobs', icon: Wrench },
  { href: '/billing', label: 'Billing', icon: ReceiptEuro },
  { href: '/more', label: 'More', icon: Menu },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <div className="flex min-h-dvh w-full">
      <PushRegister />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-base-border bg-base-surface px-4 py-6 sm:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <HardHat size={17} />
          </div>
          <span className="text-lg font-semibold">TradeMate</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-accent/10 text-accent'
                  : 'text-base-muted hover:bg-base-surface2 hover:text-base-text'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <UserMenu />
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-base-border bg-base-bg/80 px-4 py-3 backdrop-blur-lg sm:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <HardHat size={15} />
            </div>
            <span className="font-semibold">TradeMate</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28 sm:px-6 sm:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-base-border bg-base-surface/95 px-2 py-2 backdrop-blur-lg sm:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors',
                isActive(item.href) ? 'text-accent' : 'text-base-muted'
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
