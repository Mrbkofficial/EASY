'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type CartLine = {
  /** Unique per product+variant combination. */
  key: string;
  productId: string;
  slug: string;
  title: string;
  image: string;
  unitPrice: number; // cents
  variant?: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, 'key' | 'quantity'>, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'nova_cart_v1';

function lineKey(productId: string, variant?: string) {
  return variant ? `${productId}::${variant}` : productId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);

    return {
      lines,
      count,
      subtotal,
      add: (line, quantity = 1) => {
        const key = lineKey(line.productId, line.variant);
        setLines((prev) => {
          const existing = prev.find((l) => l.key === key);
          if (existing) {
            return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l));
          }
          return [...prev, { ...line, key, quantity }];
        });
      },
      setQuantity: (key, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
        ),
      remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
