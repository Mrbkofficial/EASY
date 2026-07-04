'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { ModeProvider } from '@/context/ModeContext';
import { ToastProvider } from '@/context/ToastContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ModeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ModeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
