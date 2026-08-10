import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { storeConfig } from './store.config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an amount in minor units (cents) as a display price. */
export function formatMoney(cents: number, currency = storeConfig.currency): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${storeConfig.currencySymbol}${(cents / 100).toFixed(2)}`;
  }
}

/** Human-friendly, hard-to-guess order reference, e.g. NV-8F3K2Q. */
export function makeOrderReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `NV-${out}`;
}
