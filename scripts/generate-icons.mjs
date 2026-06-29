/**
 * Generates PWA icons without external dependencies.
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.min(1, Math.max(0, (x + y) / (size * 2)));

      const r = lerp(255, 118, t);
      const g = lerp(107, 75, t);
      const b = lerp(157, 162, t);

      if (dist <= radius) {
        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
        pixels[i + 3] = 255;
      } else if (dist <= radius + size * 0.04) {
        const edge = 1 - (dist - radius) / (size * 0.04);
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        pixels[i + 3] = Math.round(edge * 255);
      } else {
        pixels[i + 3] = 0;
      }

      // Sparkle star shape in center
      const sx = (x - cx) / radius;
      const sy = (y - cy) / radius;
      const star = Math.abs(sx) + Math.abs(sy) < 0.35 || (Math.abs(sx) < 0.12 && Math.abs(sy) < 0.55);
      if (star && dist < radius * 0.75) {
        pixels[i] = 255;
        pixels[i + 1] = 230;
        pixels[i + 2] = 109;
        pixels[i + 3] = 255;
      }
    }
  }

  return pixels;
}

function encodePNG(size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  const pixels = drawIcon(size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

for (const size of [180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon-180.png' : `icon-${size}.png`;
  writeFileSync(join(root, name), encodePNG(size));
  console.log(`Wrote ${name}`);
}
