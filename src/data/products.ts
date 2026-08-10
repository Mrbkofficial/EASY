// ---------------------------------------------------------------------------
// PRODUCT CATALOG
//
// This is where products live. When you (the owner) share a supplier product
// link, a new entry gets added here with localised images and copy. The
// `sourceUrl` is the private link used only for fulfilment in the admin
// dashboard — it is NEVER sent to the browser or shown to customers.
//
// To publish a draft product:
//   1. Drop its images into /public/products/<slug>/ (jpg/png/webp/svg).
//   2. Fill in title, blurb, description, priceCents (in CENTS), highlights.
//   3. Set active: true.
// ---------------------------------------------------------------------------

export type ProductOption = {
  // e.g. "Colour" or "Size"
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  /** Short one-liner shown on cards. */
  blurb: string;
  /** Full description (supports plain paragraphs). */
  description: string;
  /** Selling price in minor units (cents). */
  priceCents: number;
  /** Optional "was" price in cents, shown struck through to signal a deal. */
  compareAtCents?: number;
  images: string[];
  category: string;
  /** 0–5, one decimal. Purely cosmetic social proof. */
  rating?: number;
  reviewCount?: number;
  options?: ProductOption[];
  /** Marketing bullet points. */
  highlights?: string[];
  /** PRIVATE supplier link — admin/fulfilment only, never exposed publicly. */
  sourceUrl?: string;
  active?: boolean;
};

// ---------------------------------------------------------------------------
// DRAFTS — the 5 links you shared.
// Each is wired to its supplier link (used only by the admin "Order" button)
// and is set to `active: false` so it does NOT show on the storefront yet.
// Once you send the title / price / a couple of features / photos for each,
// these get filled in and flipped to `active: true`.
// ---------------------------------------------------------------------------
export const products: Product[] = [
  {
    id: 'p_1',
    slug: 'product-1',
    title: 'Product 1 — details pending',
    blurb: 'Coming soon.',
    description: 'Details and photos to be added.',
    priceCents: 0,
    images: ['/products/_placeholder.svg'],
    category: 'Uncategorised',
    sourceUrl: 'https://share.temu.com/RR10vAaqfLB',
    active: false,
  },
  {
    id: 'p_2',
    slug: 'product-2',
    title: 'Product 2 — details pending',
    blurb: 'Coming soon.',
    description: 'Details and photos to be added.',
    priceCents: 0,
    images: ['/products/_placeholder.svg'],
    category: 'Uncategorised',
    sourceUrl: 'https://share.temu.com/LtD843LuhkB',
    active: false,
  },
  {
    id: 'p_3',
    slug: 'product-3',
    title: 'Product 3 — details pending',
    blurb: 'Coming soon.',
    description: 'Details and photos to be added.',
    priceCents: 0,
    images: ['/products/_placeholder.svg'],
    category: 'Uncategorised',
    sourceUrl: 'https://share.temu.com/JgvPV1wZs3B',
    active: false,
  },
  {
    id: 'p_4',
    slug: 'product-4',
    title: 'Product 4 — details pending',
    blurb: 'Coming soon.',
    description: 'Details and photos to be added.',
    priceCents: 0,
    images: ['/products/_placeholder.svg'],
    category: 'Uncategorised',
    sourceUrl: 'https://share.temu.com/zQIFqZjXuuB',
    active: false,
  },
  {
    id: 'p_5',
    slug: 'product-5',
    title: 'Product 5 — details pending',
    blurb: 'Coming soon.',
    description: 'Details and photos to be added.',
    priceCents: 0,
    images: ['/products/_placeholder.svg'],
    category: 'Uncategorised',
    sourceUrl: 'https://share.temu.com/L7QYzmVPOjB',
    active: false,
  },
];

/** Product with the private supplier link removed — safe to send to the browser. */
export type PublicProduct = Omit<Product, 'sourceUrl'>;

/** Strip fields that must never leave the server. */
export function toPublic(product: Product): PublicProduct {
  const { sourceUrl: _sourceUrl, ...rest } = product;
  return rest;
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug && p.active !== false);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function activeProducts(): Product[] {
  return products.filter((p) => p.active !== false);
}
