// Generates TradeMate PWA icons (solid teal tile + white hard-hat glyph) as PNGs.
// Pure Node — no image libraries. Run: node scripts/gen-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TEAL = [13, 148, 136];
const DARK = [8, 12, 12];
const WHITE = [255, 255, 255];

function mix(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
}

// Draw a hard-hat silhouette centred in a size x size canvas, on a rounded tile.
function draw(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const radius = maskable ? size : size * 0.22; // maskable = full bleed square
  const cx = size / 2;

  // Hard hat geometry (relative to size)
  const domeCx = size * 0.5;
  const domeCy = size * 0.56;
  const domeRx = size * 0.26;
  const domeRy = size * 0.24;
  const brimY = size * 0.6;
  const brimH = size * 0.075;
  const brimHalf = size * 0.36;
  const knobW = size * 0.06;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Rounded-rect tile mask
      const dx = Math.max(radius - x, x - (size - radius), 0);
      const dy = Math.max(radius - y, y - (size - radius), 0);
      const inTile = dx * dx + dy * dy <= radius * radius;
      if (!inTile) {
        buf[i + 3] = 0;
        continue;
      }

      // Vertical gradient background
      let color = mix(TEAL, mix(TEAL, DARK, 0.25), y / size);

      // Dome (upper ellipse, only above brim)
      const inDome =
        y <= brimY &&
        ((x - domeCx) ** 2) / (domeRx * domeRx) + ((y - domeCy) ** 2) / (domeRy * domeRy) <= 1;
      // Brim (rounded bar)
      const inBrim = y >= brimY && y <= brimY + brimH && Math.abs(x - cx) <= brimHalf;
      // Top knob
      const inKnob = Math.abs(x - cx) <= knobW && y >= domeCy - domeRy - size * 0.05 && y <= domeCy - domeRy + size * 0.02;

      if (inDome || inBrim || inKnob) color = WHITE;

      buf[i] = color[0];
      buf[i + 1] = color[1];
      buf[i + 2] = color[2];
      buf[i + 3] = 255;
    }
  }
  return buf;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // rows with filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
  ['favicon.png', 64, {}],
];

for (const [name, size, opts] of targets) {
  fs.writeFileSync(path.join(outDir, name), encodePNG(size, draw(size, opts)));
  console.log('wrote', name);
}
