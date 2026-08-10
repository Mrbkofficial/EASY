// Generates lightweight SVG placeholder images for the demo catalog so the
// storefront renders before real product photos are added. Safe to delete
// once every product has real images.
const fs = require('fs');
const path = require('path');

const items = [
  { slug: 'aurora-sunset-lamp', n: 2, label: 'Aurora Lamp', c1: '#f6a35c', c2: '#c2410c' },
  { slug: 'smart-posture-trainer', n: 1, label: 'Posture Trainer', c1: '#5eead4', c2: '#0f766e' },
  { slug: 'pocket-thermal-printer', n: 2, label: 'Pocket Printer', c1: '#a5b4fc', c2: '#4338ca' },
  { slug: 'music-sync-led-strip', n: 1, label: 'LED Strip', c1: '#f0abfc', c2: '#a21caf' },
  { slug: 'bladeless-neck-fan', n: 1, label: 'Neck Fan', c1: '#7dd3fc', c2: '#0369a1' },
  { slug: 'travel-cosmetic-organizer', n: 1, label: 'Cosmetic Bag', c1: '#fda4af', c2: '#be123c' },
];

const svg = (label, c1, c2, idx) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="400" cy="330" r="150" fill="rgba(255,255,255,0.18)"/>
  <text x="400" y="345" font-family="system-ui,sans-serif" font-size="44" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>
  <text x="400" y="405" font-family="system-ui,sans-serif" font-size="24" fill="rgba(255,255,255,0.85)" text-anchor="middle">product photo ${idx}</text>
</svg>`;

for (const item of items) {
  const dir = path.join(__dirname, '..', 'public', 'products', item.slug);
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= item.n; i++) {
    fs.writeFileSync(path.join(dir, `${i}.svg`), svg(item.label, item.c1, item.c2, i));
  }
}
console.log('Placeholder images generated.');
