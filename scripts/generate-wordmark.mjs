#!/usr/bin/env node
// Generate a building wordmark lockup pair (rectangular + square) as
// outlined-path SVGs. Used by Trophy Maps as building_logo_url (square,
// renders as 48×48 pin) and building_tooltip_logo_url (rectangular,
// renders on building hover).
//
// See docs:
//   knowledge/project-delivery/assets/building-wordmarks.md
//
// Usage:
//   node scripts/generate-wordmark.mjs <config.json>
//
// Or in-script: edit CONFIG below and run `node scripts/generate-wordmark.mjs`.
// CLI mode is preferred for new buildings; in-script is the fallback
// when you're iterating fast.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ----- Config -----
// Inline default for the "{NUM}—W—{NUM}" pattern (39 W 37 / 119 W 57
// style). A CLI arg overrides this. Numbers render in a serif display
// face; the centre separator renders in a sans face, slightly lifted
// off baseline, in the building's accent colour.
const DEFAULT_CONFIG = {
  slug: '39w37',
  left: '39',
  sep: '—W—',
  right: '37',
  tokens: {
    ink: '#1a1814',
    accent: '#c79962',
    paper: '#f5f1e8',
  },
  fonts: {
    // Fontsource-hosted WOFFs on jsDelivr. Pick the family + weight that
    // matches the building's site design tokens (--font-display and
    // --font-mono). Fonts download into scripts/.fonts-cache/ on first
    // run.
    display: {
      family: 'fraunces',
      weight: 500,
    },
    sep: {
      family: 'inter',
      weight: 400,
    },
  },
  // Visual proportions inside the lockup (in em-relative units).
  layout: {
    numSize: 200,
    sepSizeRatio: 0.38,   // separator size as a fraction of numSize
    gapRatio: 0.05,       // gap between groups, as a fraction of numSize
    sepLiftRatio: 0.28,   // vertical lift of the separator (centres it
                          // on the numbers' x-height midline)
    padXRatio: 0.06,      // rectangular outer padding, fractions of numSize
    padYRatio: 0.10,
    squareSize: 400,      // square viewBox
    squareWidthFrac: 0.78, // mark fills this fraction of square width
    squareHeightFrac: 0.32, // ...or this fraction of height (min wins)
  },
};

// ----- Resolve config -----
let config = DEFAULT_CONFIG;
if (process.argv[2]) {
  const cfgPath = path.resolve(process.argv[2]);
  config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  // Backfill any missing fields from defaults.
  config.tokens = { ...DEFAULT_CONFIG.tokens, ...(config.tokens || {}) };
  config.fonts = {
    display: { ...DEFAULT_CONFIG.fonts.display, ...((config.fonts || {}).display || {}) },
    sep: { ...DEFAULT_CONFIG.fonts.sep, ...((config.fonts || {}).sep || {}) },
  };
  config.layout = { ...DEFAULT_CONFIG.layout, ...(config.layout || {}) };
}

// ----- Fetch font files (cached) -----
const CACHE_DIR = path.join(REPO_ROOT, 'scripts', '.fonts-cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

async function fetchFont({ family, weight }) {
  const fname = `${family}-latin-${weight}-normal.woff`;
  const local = path.join(CACHE_DIR, fname);
  if (fs.existsSync(local) && fs.statSync(local).size > 1000) return local;
  const url = `https://cdn.jsdelivr.net/npm/@fontsource/${family}@5.0.20/files/${fname}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Font fetch failed: ${url} → HTTP ${res.status}. ` +
      `Confirm the family/weight exists at fontsource (https://fontsource.org).`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(local, buf);
  return local;
}

function loadFont(p) {
  const buf = fs.readFileSync(p);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

// ----- Render per-glyph -----
// Walks character-by-character (font.charToGlyph + glyph.getPath) to
// bypass opentype.js's GSUB feature processing — some Inter/Fraunces
// lookup formats are unsupported and throw. Side effect: no ligatures
// or contextual swaps. Fine for digits, em-dashes, and basic latin.
function renderGroup(font, text, size) {
  const scale = size / font.unitsPerEm;
  const parts = [];
  let pen = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    const glyphPath = glyph.getPath(pen, 0, size);
    parts.push(glyphPath.toPathData(2));
    const bb = glyphPath.getBoundingBox();
    if (bb.x1 < minX) minX = bb.x1;
    if (bb.y1 < minY) minY = bb.y1;
    if (bb.x2 > maxX) maxX = bb.x2;
    if (bb.y2 > maxY) maxY = bb.y2;
    pen += glyph.advanceWidth * scale;
  }
  return { d: parts.join(' '), bb: { x1: minX, y1: minY, x2: maxX, y2: maxY } };
}

function txAttr(dx, dy) {
  const fx = Number(dx.toFixed(2));
  const fy = Number(dy.toFixed(2));
  if (fx === 0 && fy === 0) return '';
  return ` transform="translate(${fx} ${fy})"`;
}

// ----- Main -----
const displayFontPath = await fetchFont(config.fonts.display);
const sepFontPath = await fetchFont(config.fonts.sep);
const display = loadFont(displayFontPath);
const sep = loadFont(sepFontPath);

const { layout, tokens } = config;
const NUM = layout.numSize;
const SEP = NUM * layout.sepSizeRatio;
const GAP = NUM * layout.gapRatio;
const LIFT = NUM * layout.sepLiftRatio;

const left = renderGroup(display, config.left, NUM);
const mid = renderGroup(sep, config.sep, SEP);
const right = renderGroup(display, config.right, NUM);

// Lay groups out along a shared baseline using SVG translates.
const leftDX = -left.bb.x1;
const leftRight = left.bb.x2 + leftDX;
const midDX = leftRight + GAP - mid.bb.x1;
const midDY = -LIFT;
const midRight = mid.bb.x2 + midDX;
const rightDX = midRight + GAP - right.bb.x1;
const rightRight = right.bb.x2 + rightDX;

const contentMinX = 0;
const contentMaxX = rightRight;
const contentMinY = Math.min(left.bb.y1, mid.bb.y1 + midDY, right.bb.y1);
const contentMaxY = Math.max(left.bb.y2, mid.bb.y2 + midDY, right.bb.y2);
const contentW = contentMaxX - contentMinX;
const contentH = contentMaxY - contentMinY;

// ---- Rectangular ----
const padX = NUM * layout.padXRatio;
const padY = NUM * layout.padYRatio;
const rectW = Math.round(contentW + padX * 2);
const rectH = Math.round(contentH + padY * 2);
const globalDX = padX - contentMinX;
const globalDY = padY - contentMinY;

const rectSvg = `<svg width="${rectW}" height="${rectH}" viewBox="0 0 ${rectW} ${rectH}" fill="none" xmlns="http://www.w3.org/2000/svg">
<g${txAttr(globalDX, globalDY)}>
<path${txAttr(leftDX, 0)} d="${left.d}" fill="${tokens.ink}"/>
<path${txAttr(midDX, midDY)} d="${mid.d}" fill="${tokens.accent}"/>
<path${txAttr(rightDX, 0)} d="${right.d}" fill="${tokens.ink}"/>
</g>
</svg>
`;

// ---- Square ----
const SQ = layout.squareSize;
const targetW = SQ * layout.squareWidthFrac;
const targetH = SQ * layout.squareHeightFrac;
const scaleFit = Math.min(targetW / contentW, targetH / contentH);
const markW = contentW * scaleFit;
const markH = contentH * scaleFit;
const sqOffX = (SQ - markW) / 2 - contentMinX * scaleFit;
const sqOffY = (SQ - markH) / 2 - contentMinY * scaleFit;

const squareSvg = `<svg width="${SQ}" height="${SQ}" viewBox="0 0 ${SQ} ${SQ}" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="${SQ}" height="${SQ}" fill="${tokens.paper}"/>
<g transform="translate(${sqOffX.toFixed(2)} ${sqOffY.toFixed(2)}) scale(${scaleFit.toFixed(4)})">
<path${txAttr(leftDX, 0)} d="${left.d}" fill="${tokens.ink}"/>
<path${txAttr(midDX, midDY)} d="${mid.d}" fill="${tokens.accent}"/>
<path${txAttr(rightDX, 0)} d="${right.d}" fill="${tokens.ink}"/>
</g>
</svg>
`;

const outDir = path.join(REPO_ROOT, 'building-logos', config.slug);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'wordmark.svg'), rectSvg);
fs.writeFileSync(path.join(outDir, 'wordmark-square.svg'), squareSvg);

console.log('Wrote:');
console.log(' ', path.join(outDir, 'wordmark.svg'), `(${rectW}×${rectH})`);
console.log(' ', path.join(outDir, 'wordmark-square.svg'), `(${SQ}×${SQ})`);
