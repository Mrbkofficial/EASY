// ---------------------------------------------------------------------------
// Store configuration — edit these to rebrand the whole site.
// Nothing here references any supplier; this is a standalone brand.
// ---------------------------------------------------------------------------

export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'The Pit Stop',
  tagline: 'Your one-stop shop for gear that keeps you moving.',
  // ISO currency code + symbol used across the storefront.
  currency: (process.env.NEXT_PUBLIC_CURRENCY || 'usd').toLowerCase(),
  currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$',
  // Flat shipping fee in minor units (cents). Set to 0 for free shipping.
  shippingFlatCents: Number(process.env.NEXT_PUBLIC_SHIPPING_CENTS || 499),
  // Orders at or above this subtotal (cents) ship free. 0 disables the rule.
  freeShippingThresholdCents: Number(process.env.NEXT_PUBLIC_FREE_SHIP_CENTS || 3500),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
} as const;

export function shippingFor(subtotalCents: number): number {
  const { shippingFlatCents, freeShippingThresholdCents } = storeConfig;
  if (freeShippingThresholdCents > 0 && subtotalCents >= freeShippingThresholdCents) {
    return 0;
  }
  return shippingFlatCents;
}
