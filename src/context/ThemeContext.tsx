'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(pref: ThemePref) {
  const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>('system');

  useEffect(() => {
    const saved = (localStorage.getItem('easy:theme') as ThemePref | null) ?? 'system';
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  const setTheme = (t: ThemePref) => {
    setThemeState(t);
    localStorage.setItem('easy:theme', t);
    applyTheme(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
