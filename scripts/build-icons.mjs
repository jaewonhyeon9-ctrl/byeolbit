// Generates PWA icons (192/512) and apple-touch-icon (180) from a single SVG source.
// Run: node scripts/build-icons.mjs

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const PUBLIC = resolve(process.cwd(), 'public');

// Beige + earthtone seal — star inside cracked stamp ring
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5ecd6"/>
      <stop offset="100%" stop-color="#e6d4a8"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="#f8e7a8" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#f5ecd6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="seal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a85e3e"/>
      <stop offset="100%" stop-color="#7a3f24"/>
    </linearGradient>
    <linearGradient id="star" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff7d8"/>
      <stop offset="100%" stop-color="#e8c66b"/>
    </linearGradient>
  </defs>

  <!-- Safe-area fill for maskable: paint full square with bg -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#glow)"/>

  <!-- Outer seal ring (slightly inside safe area: maskable safe area is roughly the inner 80%) -->
  <g transform="translate(256 256)">
    <circle r="180" fill="none" stroke="url(#seal)" stroke-width="22"/>
    <circle r="156" fill="none" stroke="url(#seal)" stroke-width="6" stroke-dasharray="2 8" opacity="0.55"/>

    <!-- Star -->
    <polygon
      fill="url(#star)"
      stroke="#7a3f24" stroke-width="4" stroke-linejoin="round"
      points="0,-110 30,-34 110,-34 45,16 70,92 0,46 -70,92 -45,16 -110,-34 -30,-34"
    />
    <!-- Tiny sparkle dots -->
    <circle cx="-130" cy="-130" r="5" fill="#a85e3e"/>
    <circle cx="135" cy="-115" r="4" fill="#a85e3e" opacity="0.7"/>
    <circle cx="-120" cy="135" r="3" fill="#a85e3e" opacity="0.7"/>
    <circle cx="125" cy="130" r="5" fill="#a85e3e"/>
  </g>
</svg>
`.trim();

const svgPath = resolve(PUBLIC, 'icon.svg');
writeFileSync(svgPath, svg);
console.log('wrote', svgPath);

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of targets) {
  const out = resolve(PUBLIC, name);
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(out);
  console.log('wrote', out);
}
