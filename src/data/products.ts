// ---------------------------------------------------------------------------
// PRODUCT CATALOG
//
// This is where products live. When you (the owner) share a supplier product
// link, a new entry gets added here with localised images and copy. The
// `sourceUrl` is the private link used only for fulfilment in the admin
// dashboard — it is NEVER sent to the browser or shown to customers.
//
// To add a product:
//   1. Drop its images into /public/products/<slug>/ (jpg/png/webp).
//   2. Add an entry below.
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

// NOTE: These are placeholder demo products so the site renders out of the box.
// They will be replaced with real items as you share links.
export const products: Product[] = [
  {
    id: 'p_aurora_lamp',
    slug: 'aurora-sunset-lamp',
    title: 'Aurora Sunset Projection Lamp',
    blurb: 'Turn any room into a golden-hour glow.',
    description:
      'A rechargeable LED projector that washes your walls and ceiling in a warm, adjustable sunset. Rotate the head to aim it anywhere, dim it to match your mood, and set it on a timer for a calming wind-down. USB-C rechargeable with up to 6 hours of glow on a full charge.',
    priceCents: 2499,
    compareAtCents: 3999,
    images: ['/products/aurora-sunset-lamp/1.svg', '/products/aurora-sunset-lamp/2.svg'],
    category: 'Home & Lighting',
    rating: 4.8,
    reviewCount: 1243,
    options: [{ name: 'Colour', values: ['Sunset Orange', 'Ocean Blue', 'Rainbow'] }],
    highlights: [
      '16 colour modes with adjustable brightness',
      '360° rotating head — aim it anywhere',
      'USB-C rechargeable, up to 6 hrs per charge',
      'Timer + remote control included',
    ],
    sourceUrl: '',
    active: true,
  },
  {
    id: 'p_posture_corrector',
    slug: 'smart-posture-trainer',
    title: 'Smart Posture Trainer',
    blurb: 'A gentle buzz whenever you slouch.',
    description:
      'A lightweight wearable that clips discreetly under your shirt and vibrates softly the moment you start to slouch, retraining your posture over a few weeks. Pairs with a companion app to track your daily upright time. Comfortable enough to forget you are wearing it.',
    priceCents: 1899,
    compareAtCents: 2999,
    images: ['/products/smart-posture-trainer/1.svg'],
    category: 'Health & Wellness',
    rating: 4.6,
    reviewCount: 872,
    highlights: [
      'Real-time slouch detection with gentle haptics',
      'Up to 15 days of battery per charge',
      'Discreet — clips under any outfit',
      'Progress tracking companion app',
    ],
    sourceUrl: '',
    active: true,
  },
  {
    id: 'p_mini_printer',
    slug: 'pocket-thermal-printer',
    title: 'Pocket Thermal Photo Printer',
    blurb: 'Print notes, photos & lists — no ink, ever.',
    description:
      'A palm-sized Bluetooth printer that turns photos, to-do lists, study notes and labels into instant thermal prints straight from your phone. No ink or toner — just refillable thermal paper rolls. Perfect for journaling, planners and gift tags.',
    priceCents: 2999,
    compareAtCents: 4599,
    images: ['/products/pocket-thermal-printer/1.svg', '/products/pocket-thermal-printer/2.svg'],
    category: 'Gadgets',
    rating: 4.7,
    reviewCount: 2051,
    options: [{ name: 'Colour', values: ['White', 'Pink', 'Green'] }],
    highlights: [
      'Inkless thermal printing — never buy toner',
      'Prints from the free companion app',
      'Rechargeable, fits in a pocket',
      'Includes 3 paper rolls to start',
    ],
    sourceUrl: '',
    active: true,
  },
  {
    id: 'p_led_strip',
    slug: 'music-sync-led-strip',
    title: 'Music-Sync LED Light Strip (5m)',
    blurb: 'Lights that dance to your music.',
    description:
      'Five metres of adhesive RGB LED strip that reacts in real time to whatever you are playing, with app and remote control for millions of colours, scenes and brightness levels. Cut-to-length and easy to route around desks, beds and TVs.',
    priceCents: 1599,
    compareAtCents: 2499,
    images: ['/products/music-sync-led-strip/1.svg'],
    category: 'Home & Lighting',
    rating: 4.5,
    reviewCount: 3390,
    options: [{ name: 'Length', values: ['5m', '10m', '15m'] }],
    highlights: [
      'Built-in mic syncs colour to music',
      'Control by app or included remote',
      'Strong 3M adhesive backing',
      'Cuttable to fit any space',
    ],
    sourceUrl: '',
    active: true,
  },
  {
    id: 'p_neck_fan',
    slug: 'bladeless-neck-fan',
    title: 'Bladeless Portable Neck Fan',
    blurb: 'Hands-free cooling that goes anywhere.',
    description:
      'A hands-free, bladeless neck fan with three speeds and dual airflow outlets that keep you cool on commutes, walks and workouts — no tangled hair, no dropped grip. USB-C rechargeable for a full day of breeze.',
    priceCents: 2199,
    compareAtCents: 3299,
    images: ['/products/bladeless-neck-fan/1.svg'],
    category: 'Gadgets',
    rating: 4.4,
    reviewCount: 640,
    options: [{ name: 'Colour', values: ['White', 'Black'] }],
    highlights: [
      'Bladeless & hair-safe design',
      '3 speeds, dual airflow outlets',
      'Up to 12 hrs on a charge',
      'Lightweight, wraps around your neck',
    ],
    sourceUrl: '',
    active: true,
  },
  {
    id: 'p_makeup_bag',
    slug: 'travel-cosmetic-organizer',
    title: 'Fold-Flat Travel Cosmetic Bag',
    blurb: 'Grab everything with one drawstring pull.',
    description:
      'A clever drawstring cosmetic bag that lies flat like a mat so every product is visible at a glance, then cinches shut and lifts away in one pull. Wipe-clean waterproof lining makes it ideal for travel and gym bags.',
    priceCents: 1299,
    compareAtCents: 1999,
    images: ['/products/travel-cosmetic-organizer/1.svg'],
    category: 'Beauty',
    rating: 4.7,
    reviewCount: 1580,
    options: [{ name: 'Colour', values: ['Blush', 'Sage', 'Charcoal'] }],
    highlights: [
      'Lies flat — see everything at once',
      'One-pull drawstring close',
      'Wipe-clean waterproof lining',
      'Folds small for travel',
    ],
    sourceUrl: '',
    active: true,
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
