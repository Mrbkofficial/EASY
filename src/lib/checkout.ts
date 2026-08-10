// Server-only checkout helpers. Prices and totals are ALWAYS recomputed from
// the catalog here — the browser only sends product ids, variants and
// quantities, never prices — so a tampered client can't change what's charged.
import 'server-only';
import { z } from 'zod';
import { prisma } from './prisma';
import { getProductById } from '@/data/products';
import { shippingFor } from './store.config';
import { makeOrderReference } from './utils';
import type { Order, OrderItem } from '@prisma/client';

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variant: z.string().optional(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1),
  customer: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(120),
    phone: z.string().max(40).optional().or(z.literal('')),
    address1: z.string().min(1).max(200),
    address2: z.string().max(200).optional().or(z.literal('')),
    city: z.string().min(1).max(120),
    state: z.string().max(120).optional().or(z.literal('')),
    postal: z.string().min(1).max(40),
    country: z.string().min(2).max(80),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Validate the cart, recompute money from the catalog, and create a PENDING
 * order. Returns the persisted order (with items) ready for a payment session.
 */
export async function createPendingOrder(
  input: CheckoutInput,
  currency: string,
): Promise<Order & { items: OrderItem[] }> {
  const itemData = input.items.map((item) => {
    const product = getProductById(item.productId);
    if (!product || product.active === false) {
      throw new Error(`Product unavailable: ${item.productId}`);
    }
    return {
      productId: product.id,
      title: product.title,
      image: product.images[0],
      variant: item.variant || null,
      unitPrice: product.priceCents,
      quantity: item.quantity,
      sourceUrl: product.sourceUrl || null,
    };
  });

  const subtotal = itemData.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  const c = input.customer;
  return prisma.order.create({
    data: {
      reference: makeOrderReference(),
      status: 'PENDING',
      subtotal,
      shipping,
      total,
      currency,
      email: c.email,
      name: c.name,
      phone: c.phone || null,
      address1: c.address1,
      address2: c.address2 || null,
      city: c.city,
      state: c.state || null,
      postal: c.postal,
      country: c.country,
      items: { create: itemData },
    },
    include: { items: true },
  });
}
