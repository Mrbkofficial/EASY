'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Mode } from '@/types';

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('PERSONAL');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('easy:mode');
    if (saved === 'WORK' || saved === 'PERSONAL') setModeState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('easy:mode', mode);
    document.documentElement.setAttribute('data-mode', mode.toLowerCase());
  }, [mode, hydrated]);

  const setMode = (m: Mode) => setModeState(m);
  const toggleMode = () => setModeState((m) => (m === 'PERSONAL' ? 'WORK' : 'PERSONAL'));

  return <ModeContext.Provider value={{ mode, setMode, toggleMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
