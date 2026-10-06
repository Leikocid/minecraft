// scripts/lib/png.mjs: RGBA support (colour type 6), old RGB call unchanged.
// Also draws and ships the Sculk Crossbow icon — a silhouette we own, not a
// Mojang texture: stock on the diagonal, limbs to the sides, a string.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { encodePng, encodePngRgba } from '../scripts/lib/png.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconPath = join(projectRoot, 'packs', 'resource', 'textures', 'items', 'andrew_sculk_crossbow.png');

function decodePng(buf) {
  assert.equal(buf.readUInt32BE(0), 0x89504e47);
  let pos = 8;
  let ihdr;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') ihdr = data;
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const colourType = ihdr[9];
  const bytesPerPixel = colourType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bytesPerPixel;
  // Every row is written with filter 0 (none) by encode() in png.mjs; skip the filter byte per row.
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) raw.copy(pixels, y * stride, y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
  return { width, height, colourType, bytesPerPixel, pixels };
}

test('png.mjs: old RGB call is unchanged', () => {
  const rgb = Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 0]);
  const png = decodePng(encodePng({ width: 2, height: 2, rgb }));
  assert.equal(png.colourType, 2);
  assert.equal(png.width, 2);
  assert.equal(png.height, 2);
  assert.deepEqual([...png.pixels], [...rgb]);
  assert.throws(() => encodePng({ width: 2, height: 2, rgb: Uint8Array.from([1, 2, 3]) }), /rgb is 3 bytes/);
});

test('png.mjs: new RGBA call round-trips alpha', () => {
  const rgba = Uint8Array.from([10, 20, 30, 255, 0, 0, 0, 0, 40, 50, 60, 128, 255, 255, 255, 255]);
  const png = decodePng(encodePngRgba({ width: 2, height: 2, rgba }));
  assert.equal(png.colourType, 6);
  assert.equal(png.bytesPerPixel, 4);
  assert.deepEqual([...png.pixels], [...rgba]);
  assert.throws(() => encodePngRgba({ width: 2, height: 2, rgba: Uint8Array.from([1, 2, 3]) }), /rgba is 3 bytes/);
});

test('png.mjs adds no dependency: only node:zlib is imported', () => {
  const src = readFileSync(join(projectRoot, 'scripts', 'lib', 'png.mjs'), 'utf-8');
  const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
  assert.deepEqual(imports, ['node:zlib']);
});

// Colours are sourced from resources already in the pack, not invented:
// - dark/mid teal: the sculk block-colour palette scripts/render-structure.mjs uses to
//   preview this add-on's own Warden-city structures (andrew:sculk / andrew:sculk_sensor).
// - bright accent: Bedrock's standard §3/§b formatting codes, the same ones
//   packs/resource/texts/{ru_RU,en_US}.lang already use to highlight this item's own
//   name in the first-craft announcement (andrew.sculk_crossbow.first_craft).
const PALETTE = {
  '.': null,
  d: [26, 38, 44], // outline — render-structure.mjs:110 minecraft:sculk
  m: [42, 74, 82], // limbs   — render-structure.mjs:112 minecraft:sculk_sensor
  h: [0, 170, 170], // stock  — Bedrock §3 dark_aqua
  w: [85, 255, 255], // string — Bedrock §b aqua (ru_RU.lang:36 / en_US.lang:36)
};

const SIZE = 16;

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill('.'));
}

function setPx(grid, x, y, c) {
  if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) grid[y][x] = c;
}

// Bresenham, with a 1px perpendicular thickening pass for thick > 1.
function line(grid, x0, y0, x1, y1, c, thick = 1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const sx = x < tx ? 1 : -1;
  const dy = -Math.abs(ty - y);
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPx(grid, x, y, c);
    if (thick > 1) setPx(grid, dx >= -dy ? x : x + 1, dx >= -dy ? y + 1 : y, c);
    if (x === tx && y === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawCrossbowGrid() {
  const grid = emptyGrid();
  const pivot = [10, 6];
  // Limbs: two bent segments each, bowing outward away from the stock.
  line(grid, pivot[0], pivot[1], 4, 3, 'm', 2);
  line(grid, 4, 3, 0, 2, 'm', 2);
  line(grid, pivot[0], pivot[1], 4, 10, 'm', 2);
  line(grid, 4, 10, 0, 12, 'm', 2);
  // Stock: diagonal from the limbs down to the hilt.
  line(grid, pivot[0], pivot[1], 15, 15, 'h', 2);
  // String: straight, spanning the limb tips.
  line(grid, 0, 2, 0, 12, 'w', 1);

  // Outline pass: a 1px dark edge around the silhouette so it reads against any background.
  const base = grid.map((row) => row.slice());
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (base[y][x] === '.') continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        if (base[y]?.[x] !== '.' && base[y + dy]?.[x + dx] === '.') setPx(grid, x + dx, y + dy, 'd');
      }
    }
  }
  return grid;
}

function gridToRgba(grid) {
  const rgba = new Uint8Array(SIZE * SIZE * 4);
  let i = 0;
  for (const row of grid) {
    for (const c of row) {
      const rgb = PALETTE[c];
      if (rgb) {
        rgba[i] = rgb[0];
        rgba[i + 1] = rgb[1];
        rgba[i + 2] = rgb[2];
        rgba[i + 3] = 255;
      }
      i += 4;
    }
  }
  return rgba;
}

test('sculk crossbow icon: 16x16 RGBA silhouette in sculk colours, written to the resource pack', () => {
  const grid = drawCrossbowGrid();
  const rgba = gridToRgba(grid);
  const bytes = encodePngRgba({ width: SIZE, height: SIZE, rgba });
  writeFileSync(iconPath, bytes);

  const png = decodePng(readFileSync(iconPath));
  assert.equal(png.width, 16);
  assert.equal(png.height, 16);
  assert.equal(png.colourType, 6, 'icons need an alpha channel');

  let opaque = 0;
  for (let p = 0; p < png.pixels.length; p += 4) if (png.pixels[p + 3] > 0) opaque++;
  assert.ok(opaque >= 40 && opaque <= 140, `opaque pixel count ${opaque} should land between 40 and 140 of 256`);

  const usedColours = new Set();
  for (let p = 0; p < png.pixels.length; p += 4) {
    if (png.pixels[p + 3] === 0) continue;
    usedColours.add(`${png.pixels[p]},${png.pixels[p + 1]},${png.pixels[p + 2]}`);
  }
  const knownColours = new Set(Object.values(PALETTE).filter(Boolean).map((c) => c.join(',')));
  for (const used of usedColours) assert.ok(knownColours.has(used), `unexpected colour ${used} not from the named palette`);
});
