// Money + Irish VAT helpers. All amounts are stored and computed in euros.

// Irish VAT rates relevant to trades. 13.5% is the reduced rate that applies to
// most construction/repair labour; 23% is the standard rate on materials/goods.
export const IRISH_VAT_RATES = [
  { rate: 23, label: '23% — Standard' },
  { rate: 13.5, label: '13.5% — Reduced (labour)' },
  { rate: 9, label: '9% — Second reduced' },
  { rate: 0, label: '0% — Zero / exempt' },
] as const;

export interface LineItemLike {
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface Totals {
  subtotal: number;
  vatTotal: number;
  total: number;
  vatByRate: { rate: number; net: number; vat: number }[];
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeTotals(items: LineItemLike[]): Totals {
  const byRate = new Map<number, { net: number; vat: number }>();
  let subtotal = 0;
  let vatTotal = 0;

  for (const item of items) {
    const net = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const vat = net * ((Number(item.vatRate) || 0) / 100);
    subtotal += net;
    vatTotal += vat;
    const bucket = byRate.get(item.vatRate) ?? { net: 0, vat: 0 };
    bucket.net += net;
    bucket.vat += vat;
    byRate.set(item.vatRate, bucket);
  }

  const vatByRate = [...byRate.entries()]
    .map(([rate, v]) => ({ rate, net: round2(v.net), vat: round2(v.vat) }))
    .sort((a, b) => b.rate - a.rate);

  return {
    subtotal: round2(subtotal),
    vatTotal: round2(vatTotal),
    total: round2(subtotal + vatTotal),
    vatByRate,
  };
}

export function formatEUR(amount: number | null | undefined): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(amount) || 0);
}
