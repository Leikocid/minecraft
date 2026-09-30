// Ring rasterisation geometry (L0-ring-p001, L0-ring-r001, L0-ring-ent1, L0-ring-as06).
// Pure TS, no @minecraft/server import — bundled directly, no engine stub needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const bundle = await build({
  stdin: { contents: `export * from './src/orbital/ring-layout.ts';`, resolveDir: projectRoot, loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});
const { layout, buildColumns, RING_LAYOUT, RING_MAX_CHARGES } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);

const key = (c) => `${c.x},${c.z}`;

/** BFS reachability of `cells` under 8-connectivity, starting from cells[0]. */
function sameRingComponent(cells) {
  const set = new Set(cells.map(key));
  const reached = new Set([key(cells[0])]);
  const stack = [cells[0]];
  while (stack.length > 0) {
    const c = stack.pop();
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        const n = { x: c.x + dx, z: c.z + dz };
        const k = key(n);
        if (set.has(k) && !reached.has(k)) {
          reached.add(k);
          stack.push(n);
        }
      }
  }
  return reached;
}

/** Same-ring neighbour count for `cell` within `cells`' 8-neighbourhood. */
function sameRingDegree(cell, set) {
  let n = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      if (set.has(`${cell.x + dx},${cell.z + dz}`)) n++;
    }
  return n;
}

// ------------------------------------------------------------------ AC#1: count, no duplicates

test('layout(target): one centre + four rings, 190-215 columns, no duplicates', () => {
  const columns = layout({ x: 0, y: 64, z: 0 });
  assert.ok(columns.length >= 190 && columns.length <= 215, `count ${columns.length} outside 190-215`);
  const unique = new Set(columns.map(key));
  assert.equal(unique.size, columns.length, 'duplicate columns');
});

test('layout(target): exact column count is pinned', () => {
  const columns = layout({ x: 0, y: 64, z: 0 });
  assert.equal(columns.length, 201);
});

test('layout(target): the footprint reaches 14 blocks out in x and z', () => {
  const columns = layout({ x: 0, y: 64, z: 0 });
  const reach = Math.max(...columns.map((c) => Math.max(Math.abs(c.x), Math.abs(c.z))));
  assert.equal(reach, 14);
});

// ------------------------------------------------------------------ AC#2: closed, 8-connected rings

for (const ring of RING_LAYOUT.rings) {
  test(`d=${ring.d} ring: closed (single 8-connected component), no spurs`, () => {
    const set = new Set(ring.cells.map(key));
    const reached = sameRingComponent(ring.cells);
    assert.equal(reached.size, ring.cells.length, `ring d=${ring.d} has a gap: only ${reached.size}/${ring.cells.length} cells reachable`);
    for (const cell of ring.cells) {
      const degree = sameRingDegree(cell, set);
      assert.ok(degree >= 2, `ring d=${ring.d} cell (${cell.x},${cell.z}) has a spur: only ${degree} same-ring neighbour(s)`);
    }
  });
}

// ------------------------------------------------------------------ AC#3: radial error <= 0.75

for (const ring of RING_LAYOUT.rings) {
  test(`d=${ring.d} ring: every cell within r ± 0.75`, () => {
    for (const cell of ring.cells) {
      const dist = Math.hypot(cell.x, cell.z);
      const error = Math.abs(dist - ring.r);
      assert.ok(error <= 0.75, `cell (${cell.x},${cell.z}) radial error ${error} exceeds 0.75 for r=${ring.r}`);
    }
  });
}

// ------------------------------------------------------------------ AC#4: d=1, translation, hard cap

test('d = 1 gives exactly {0,0}', () => {
  assert.deepStrictEqual(buildColumns([1]).columns, [{ x: 0, z: 0 }]);
  assert.deepStrictEqual(RING_LAYOUT.centre, { x: 0, z: 0 });
});

test('layout(target): the offset table and slot order are the same for every target', () => {
  const targets = [
    { x: 0, y: 0, z: 0 },
    { x: 37, y: 5, z: -19 },
    { x: -1000, y: 320, z: 1000 },
  ];
  const [base, ...rest] = targets.map((t) => layout(t).map((c, i) => ({ x: c.x - t.x, z: c.z - t.z, i })));
  for (const offsets of rest) {
    assert.deepStrictEqual(offsets, base, 'offsets or slot order changed across targets');
  }
});

test('RING_MAX_CHARGES drains in at most 6 ticks, and building past it fails loudly', () => {
  // ring drains the blast queue at RING_MAX_BLASTS_PER_TICK = 48 a tick; importing
  // it here would pull @minecraft/server into this pure-geometry bundle.
  assert.equal(Math.ceil(RING_MAX_CHARGES / 48), 6);
  assert.ok(RING_MAX_CHARGES >= layout({ x: 0, y: 64, z: 0 }).length, 'the shipped table does not fit under its own cap');
  assert.throws(() => buildColumns([1000]), /RING_MAX_CHARGES/);
});

// ------------------------------------------------------------------ AC#5: centre-outward order

test('layout(target): columns run centre first, then ring by ring outwards', () => {
  const columns = layout({ x: 0, y: 64, z: 0 });
  assert.deepStrictEqual(columns[0], { x: 0, z: 0 }, 'the first column is not the centre');
  const ringOf = new Map();
  RING_LAYOUT.rings.forEach((ring, i) => {
    for (const cell of ring.cells) ringOf.set(key(cell), i + 1);
  });
  let previous = 0;
  for (const cell of columns.slice(1)) {
    const i = ringOf.get(key(cell));
    assert.notEqual(i, undefined, `column (${cell.x},${cell.z}) belongs to no ring`);
    assert.ok(i >= previous, `column (${cell.x},${cell.z}) of ring #${i} comes after ring #${previous}: the order is not centre-outward`);
    previous = i;
  }
});
