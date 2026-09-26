// src/structures/templates/bastion.ts compiled by scripts/build-structures.mjs:
// structural assertions read the built .mcstructure, never the generator's own
// constants, so they prove what ships (§14.1, §14.3, §14.4; L0-bast-r002..r004).
// Only the gold roll, which is not part of the .mcstructure, is read from the module.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSync } from 'esbuild';
import { cellIndex, parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';

const root = join(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'andrew-bastion-'));
buildStructures({ to: out });
const s = parseMcstructure(readFileSync(join(out, 'bastion.mcstructure')));
buildSync({
  entryPoints: [join(root, 'src/structures/templates/bastion.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  outfile: join(out, 'bastion.cjs'),
  logLevel: 'error',
});
const mod = createRequire(import.meta.url)(join(out, 'bastion.cjs'));
rmSync(out, { recursive: true, force: true });

const [SX, SY, SZ] = s.size;
const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
const OUTSIDE = { name: 'outside', states: {} };
const at = (x, y, z) => {
  if (!inside(x, y, z)) return OUTSIDE;
  const i = s.primary[cellIndex(s.size, x, y, z)];
  return i === -1 ? { name: 'minecraft:structure_void', states: {} } : s.palette[i];
};
const beAt = (x, y, z) => s.blockEntities.get(cellIndex(s.size, x, y, z));
const k = (x, y, z) => `${x},${y},${z}`;

function cellsOf(pred) {
  const found = [];
  for (let x = 0; x < SX; x++) for (let y = 0; y < SY; y++) for (let z = 0; z < SZ; z++) if (pred(at(x, y, z), x, y, z)) found.push([x, y, z]);
  return found;
}
const named = (name) => cellsOf((b) => b.name === name);

const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const H4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const isAir = (b) => b.name === 'minecraft:air';
const isLava = (b) => /lava/.test(b.name);
const isLadder = (b) => b.name === 'minecraft:ladder';
const isStairs = (b) => /_stairs$/.test(b.name);
/** Cells a player's body moves through. */
const passable = (b) => isAir(b) || isLadder(b);
/** Blocks a player stands on: anything solid, stairs and chests included. */
const support = (b) => !passable(b) && !isLava(b) && b.name !== 'outside' && b.name !== 'minecraft:structure_void';

const CHESTS = named('minecraft:chest');
const LAVA = cellsOf(isLava);

// The treasure island, found from the blocks: at the lava layer, the cells
// inside the lava's bounding rectangle that a flood from its border cannot
// reach without crossing lava. Non-empty means the lava encloses it.
const LAVA_Y = [...new Set(LAVA.map((c) => c[1]))];
const lavaXs = LAVA.map((c) => c[0]);
const lavaZs = LAVA.map((c) => c[2]);
const LB = { x0: Math.min(...lavaXs), x1: Math.max(...lavaXs), z0: Math.min(...lavaZs), z1: Math.max(...lavaZs) };
const ISLAND = (() => {
  const y = LAVA_Y[0];
  const inRect = (x, z) => x >= LB.x0 && x <= LB.x1 && z >= LB.z0 && z <= LB.z1;
  const seen = new Set();
  const queue = [];
  for (let x = LB.x0; x <= LB.x1; x++)
    for (let z = LB.z0; z <= LB.z1; z++)
      if ((x === LB.x0 || x === LB.x1 || z === LB.z0 || z === LB.z1) && !isLava(at(x, y, z))) {
        seen.add(`${x},${z}`);
        queue.push([x, z]);
      }
  while (queue.length) {
    const [x, z] = queue.pop();
    for (const [dx, dz] of H4) {
      const n = `${x + dx},${z + dz}`;
      if (!inRect(x + dx, z + dz) || seen.has(n) || isLava(at(x + dx, y, z + dz))) continue;
      seen.add(n);
      queue.push([x + dx, z + dz]);
    }
  }
  const cols = new Set();
  for (let x = LB.x0; x <= LB.x1; x++) for (let z = LB.z0; z <= LB.z1; z++) if (!seen.has(`${x},${z}`) && !isLava(at(x, y, z))) cols.add(`${x},${z}`);
  return cols;
})();
const onIsland = (x, z) => ISLAND.has(`${x},${z}`);
/** Feet height on the island: the first two-high open space above its top. */
const ISLAND_FEET = LAVA_Y[0] + 1;
const inTreasure = ([x, y, z]) => onIsland(x, z) && y >= ISLAND_FEET && y <= ISLAND_FEET + 1;

// Movement model. A cell is standable when the body fits (feet and head
// passable) on a support, or it is a ladder. Moves: level walking; one block up
// only onto a stair or off a ladder; ladder climbing; and falls off edges,
// measured in blocks. No jumping onto full blocks: levels must join by stairs.
const MAX_FALL = 3; // vanilla fall damage starts above 3 blocks
const standable = (x, y, z) =>
  inside(x, y, z) && passable(at(x, y, z)) && passable(at(x, y + 1, z)) && (isLadder(at(x, y, z)) || support(at(x, y - 1, z)));

/** Every move from a standable cell: [target, kind, fall]. */
function moves([x, y, z]) {
  const out = [];
  const here = at(x, y, z);
  if (isLadder(here)) {
    if (standable(x, y + 1, z)) out.push([[x, y + 1, z], 'climb', 0]);
    if (standable(x, y - 1, z)) out.push([[x, y - 1, z], 'climb', 0]);
  }
  for (const [dx, dz] of H4) {
    const [nx, nz] = [x + dx, z + dz];
    if (!inside(nx, y, nz)) continue;
    if (standable(nx, y, nz)) {
      out.push([[nx, y, nz], 'walk', 0]);
      continue;
    }
    if (standable(nx, y + 1, nz) && passable(at(x, y + 2, z)) && (isStairs(at(nx, y, nz)) || isLadder(here))) {
      out.push([[nx, y + 1, nz], isLadder(here) ? 'ladder-off' : 'stairs', 0]);
      continue;
    }
    if (passable(at(nx, y, nz)) && passable(at(nx, y + 1, nz))) {
      let yy = y;
      while (yy > 0 && !standable(nx, yy, nz) && passable(at(nx, yy - 1, nz))) yy--;
      if (standable(nx, yy, nz)) out.push([[nx, yy, nz], 'fall', y - yy]);
      else out.push([[nx, yy - 1, nz], isLava(at(nx, yy - 1, nz)) ? 'lava' : 'void', y - yy + 1]);
    }
  }
  return out;
}

/** Everything reachable from `start` without a fall above MAX_FALL and without entering lava. */
function reach(start) {
  const seen = new Set([k(...start)]);
  const cells = [start];
  for (let i = 0; i < cells.length; i++)
    for (const [n, kind, fall] of moves(cells[i])) {
      if (kind === 'lava' || kind === 'void' || fall > MAX_FALL || seen.has(k(...n))) continue;
      seen.add(k(...n));
      cells.push(n);
    }
  return { cells, keys: seen };
}

const STANDABLE = cellsOf((b, x, y, z) => standable(x, y, z));
const perY = {};
for (const [, y] of STANDABLE) perY[y] = (perY[y] ?? 0) + 1;
/** Walkable levels: feet heights with a real floor area under them. */
const LEVELS = Object.entries(perY)
  .filter(([, n]) => n >= 20)
  .map(([y]) => Number(y))
  .sort((a, b) => a - b);
/** The gate: a standable cell on the template's outer ring at its lowest height. */
const GATE = STANDABLE.filter(([x, , z]) => x === 0 || z === 0 || x === SX - 1 || z === SZ - 1).sort((a, b) => a[1] - b[1])[0];
const FROM_GATE = reach(GATE);

test('AC1: footprint ≈20×20, height 10–12, exactly 10 single chests, 3 of them in the treasure room', () => {
  const solid = cellsOf((b) => !isAir(b) && b.name !== 'minecraft:structure_void');
  const ext = [0, 1, 2].map((i) => Math.max(...solid.map((c) => c[i])) - Math.min(...solid.map((c) => c[i])) + 1);
  assert.ok(Math.abs(ext[0] - 20) <= 2 && Math.abs(ext[2] - 20) <= 2, `footprint ${ext[0]}×${ext[2]}`);
  assert.ok(ext[1] >= 10 && ext[1] <= 12, `height ${ext[1]}`);

  assert.strictEqual(CHESTS.length, 10, `${CHESTS.length} chests`);
  for (const other of ['minecraft:trapped_chest', 'minecraft:barrel', 'minecraft:ender_chest']) assert.strictEqual(named(other).length, 0, `${other} present`);
  for (const [x, y, z] of CHESTS) {
    for (const [dx, dz] of H4) assert.notStrictEqual(at(x + dx, y, z + dz).name, 'minecraft:chest', `chest ${k(x, y, z)} touches another chest`);
    const be = beAt(x, y, z);
    assert.strictEqual(be?.id, 'Chest', `chest ${k(x, y, z)} has no Chest block entity`);
    assert.ok(be.pairx === undefined && be.pairlead === undefined, `chest ${k(x, y, z)} carries pairing data`);
    assert.ok(isAir(at(x, y + 1, z)), `chest ${k(x, y, z)} cannot open: ${at(x, y + 1, z).name} on top`);
    // A player can walk up to it: some neighbour is a cell reachable from the gate, or the island (reached across lava or from above).
    assert.ok(
      H4.some(([dx, dz]) => FROM_GATE.keys.has(k(x + dx, y, z + dz)) || inTreasure([x + dx, y, z + dz])),
      `chest ${k(x, y, z)} stands where nobody can reach it`
    );
  }

  assert.ok(ISLAND.size >= 25, `treasure island of ${ISLAND.size} columns`);
  const treasure = CHESTS.filter(inTreasure);
  assert.strictEqual(treasure.length, 3, `${treasure.length} chests in the treasure room: ${treasure.map((c) => k(...c)).join(' ')}`);
  // The other seven are spread out: over every level, and no level holds more than three.
  const perLevel = {};
  for (const c of CHESTS.filter((c) => !inTreasure(c))) perLevel[c[1]] = (perLevel[c[1]] ?? 0) + 1;
  assert.deepStrictEqual(Object.keys(perLevel).map(Number).sort((a, b) => a - b), LEVELS, `other chests per level ${JSON.stringify(perLevel)}`);
  assert.ok(Math.max(...Object.values(perLevel)) <= 3, `other chests per level ${JSON.stringify(perLevel)}`);
  assert.strictEqual(s.entities?.length ?? 0, 0, 'the template carries entities');
});

test('AC2: 2–3 levels joined by stairs; every level reaches every other with no fall above 3', () => {
  assert.ok(LEVELS.length >= 2 && LEVELS.length <= 3, `levels at feet y ${LEVELS.join(' ')} (${JSON.stringify(perY)})`);
  assert.ok(GATE, 'no way in from outside');
  for (const a of LEVELS) {
    // Start anywhere on level a that the gate reaches, off the island.
    const start = FROM_GATE.cells.find(([x, y, z]) => y === a && !onIsland(x, z));
    assert.ok(start, `level ${a} is not reachable from the gate`);
    const r = reach(start);
    for (const b of LEVELS) assert.ok(r.cells.some((c) => c[1] === b && !onIsland(c[0], c[2])), `no path from level ${a} to level ${b}`);
  }
  // Level changes are stairs: each flight is a run of stair blocks, one higher per step.
  const stairs = cellsOf(isStairs);
  assert.ok(stairs.length >= 6, `${stairs.length} stair blocks`);
  // Nothing on the upper levels drops a player more than 3 blocks, nor into lava.
  const drops = [];
  for (const c of STANDABLE)
    for (const [n, kind, fall] of moves(c)) {
      if (kind === 'void' || fall > MAX_FALL) drops.push(`${k(...c)}→${k(...n)} ${kind} ${fall}`);
      if (kind === 'lava' && !(c[1] === ISLAND_FEET)) drops.push(`${k(...c)}→${k(...n)} into lava from feet ${c[1]}`);
    }
  assert.deepStrictEqual(drops, [], `dangerous drops:\n${drops.join('\n')}`);
  console.log(`# bastion levels ${LEVELS.join('/')}, standable ${JSON.stringify(perY)}, reachable from the gate ${FROM_GATE.cells.length}`);
});

const BASTION_FAMILY = /^minecraft:(blackstone|polished_blackstone|polished_blackstone_bricks|cracked_polished_blackstone_bricks|chiseled_polished_blackstone|gilded_blackstone|polished_blackstone_brick_stairs|polished_blackstone_slab|polished_blackstone_brick_slab|polished_blackstone_wall|polished_blackstone_brick_wall|blackstone_wall|blackstone_stairs|basalt|polished_basalt|gold_block|chain|lantern|soul_lantern|magma)$/;
const GOLD_ACCENT = /^minecraft:(gold_block|gilded_blackstone)$/;

test('AC3: gold accents on the outer faces, visible from every side; the body is vanilla bastion material', () => {
  const names = [...new Set(s.palette.map((p) => p.name))];
  const foreign = names.filter((n) => !BASTION_FAMILY.test(n) && !/^minecraft:(air|chest|lava|ladder)$/.test(n));
  assert.deepStrictEqual(foreign, [], `off-theme blocks: ${foreign.join(' ')}`);
  for (const n of ['minecraft:blackstone', 'minecraft:polished_blackstone', 'minecraft:polished_blackstone_bricks', 'minecraft:gilded_blackstone', 'minecraft:gold_block'])
    assert.ok(names.includes(n), `${n} missing`);
  const hull = cellsOf((b) => support(b) && b.name !== 'minecraft:chest');
  const family = hull.filter(([x, y, z]) => /blackstone|basalt/.test(at(x, y, z).name));
  assert.ok(family.length / hull.length >= 0.9, `blackstone family is ${((family.length / hull.length) * 100).toFixed(1)}% of the body`);

  // Visible: an accent face touches the space outside the template.
  const visible = cellsOf((b, x, y, z) => GOLD_ACCENT.test(b.name) && N6.some(([dx, dy, dz]) => !inside(x + dx, y + dy, z + dz) && dy === 0));
  const sides = new Set();
  for (const [x, , z] of visible) {
    if (x === 0) sides.add('W');
    if (x === SX - 1) sides.add('E');
    if (z === 0) sides.add('N');
    if (z === SZ - 1) sides.add('S');
  }
  assert.ok(visible.length >= 8, `${visible.length} gold accents on the outer faces`);
  assert.deepStrictEqual([...sides].sort(), ['E', 'N', 'S', 'W'], `gold seen only from ${[...sides].join('')}`);
  // Some accents stand high: the top of the walls is what shows first from afar.
  assert.ok(visible.some(([, y]) => y >= SY - 2), 'no gold near the top of the walls');
  // No functional or artificial marker blocks.
  const functional = names.filter((n) => /beacon|command_block|structure_block|redstone|lamp|glowstone|sea_lantern|shroomlight|end_rod|light_block/.test(n));
  assert.deepStrictEqual(functional, [], `marker-like blocks: ${functional.join(' ')}`);
});

test('AC4: 2–4 gold blocks in the treasure room, below the passage levels, ringed by ordinary lava', () => {
  const gold = named('minecraft:gold_block').filter(inTreasure);
  assert.ok(gold.length >= 2 && gold.length <= 4, `${gold.length} gold blocks in the treasure room`);
  const { TREASURE_GOLD, treasureGoldKept } = mod;
  assert.deepStrictEqual(TREASURE_GOLD.map((p) => k(...p)).sort(), gold.map((p) => k(...p)).sort(), 'TREASURE_GOLD disagrees with the built gold');
  // The creation roll: 2, 3 or 4 of them, every value reachable, always a subset of the slots.
  const counts = new Set();
  for (let i = 0; i < 300; i++) {
    const kept = treasureGoldKept(i / 300);
    counts.add(kept.length);
    for (const p of kept) assert.ok(TREASURE_GOLD.includes(p), `kept ${p} is not a gold slot`);
  }
  assert.deepStrictEqual([...counts].sort(), [2, 3, 4], `roll gives ${[...counts]}`);
  assert.strictEqual(treasureGoldKept(0.9999).length, 4);
  assert.strictEqual(treasureGoldKept(0).length, 2);

  // Below the passage levels: every level above the island's floor is higher.
  const passage = LEVELS.filter((y) => y > ISLAND_FEET);
  assert.ok(passage.length >= 1, `levels ${LEVELS.join(' ')}, island at ${ISLAND_FEET}`);
  assert.ok(ISLAND_FEET < Math.min(...passage) && ISLAND_FEET <= Math.min(...LEVELS), `island feet ${ISLAND_FEET}, levels ${LEVELS.join(' ')}`);
  // Roughly central.
  const xs = [...ISLAND].map((c) => Number(c.split(',')[0]));
  const zs = [...ISLAND].map((c) => Number(c.split(',')[1]));
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  assert.ok(Math.abs(cx - (SX - 1) / 2) <= 1 && Math.abs(cz - (SZ - 1) / 2) <= 1, `island centred at ${cx},${cz}`);

  // Ordinary lava: plain minecraft:lava source blocks, one layer, no block entity, nothing else liquid.
  assert.ok(LAVA.length >= 40, `${LAVA.length} lava cells`);
  assert.deepStrictEqual([...new Set(LAVA.map(([x, y, z]) => at(x, y, z).name))], ['minecraft:lava']);
  assert.strictEqual(LAVA_Y.length, 1, `lava on layers ${LAVA_Y}`);
  for (const [x, y, z] of LAVA) {
    assert.strictEqual(at(x, y, z).states.liquid_depth, 0, `lava ${k(x, y, z)} is not a source`);
    assert.strictEqual(beAt(x, y, z), undefined, `lava ${k(x, y, z)} carries a block entity`);
    // Contained: nothing below or beside it for the lava to run into.
    assert.ok(support(at(x, y - 1, z)), `lava ${k(x, y, z)} has ${at(x, y - 1, z).name} under it`);
    for (const [dx, dz] of H4) {
      const n = at(x + dx, y, z + dz);
      assert.ok(isLava(n) || support(n), `lava ${k(x, y, z)} runs into ${n.name} at ${k(x + dx, y, z + dz)}`);
    }
  }
  // Surrounded: every island edge column faces lava, and the moat is at least two wide all round.
  for (const c of ISLAND) {
    const [x, z] = c.split(',').map(Number);
    for (const [dx, dz] of H4) {
      if (onIsland(x + dx, z + dz)) continue;
      assert.ok(isLava(at(x + dx, LAVA_Y[0], z + dz)) && isLava(at(x + 2 * dx, LAVA_Y[0], z + 2 * dz)), `island edge ${c} is not behind two blocks of lava`);
    }
  }
  const fromGateToIsland = FROM_GATE.cells.filter(inTreasure);
  // Only from above: the gate reaches the island by the drop, never on foot across the hall floor.
  const hallStart = FROM_GATE.cells.find(([x, y, z]) => y === ISLAND_FEET && !onIsland(x, z));
  const hallOnly = new Set();
  const q = [hallStart];
  hallOnly.add(k(...hallStart));
  while (q.length) {
    const c = q.pop();
    for (const [n, kind] of moves(c)) if (kind === 'walk' && n[1] === ISLAND_FEET && !hallOnly.has(k(...n))) (hallOnly.add(k(...n)), q.push(n));
  }
  assert.ok(![...hallOnly].some((key) => inTreasure(key.split(',').map(Number))), 'the hall floor walks onto the island without crossing lava');
  assert.ok(fromGateToIsland.length > 0, 'the island is not reachable from above');
});

test('AC5 (template side): every drop into the opening lands on the island, not in lava; the island climbs back out', () => {
  const upper = STANDABLE.filter(([, y]) => y > ISLAND_FEET + 1);
  const landings = [];
  for (const c of upper)
    for (const [n, kind, fall] of moves(c)) if ((kind === 'fall' || kind === 'lava') && n[1] < c[1] - 1 && (onIsland(n[0], n[2]) || kind === 'lava')) landings.push([c, n, kind, fall]);
  assert.ok(landings.length >= 8, `${landings.length} ways to drop onto the island`);
  for (const [c, n, kind, fall] of landings) {
    assert.strictEqual(kind, 'fall', `drop from ${k(...c)} ends in lava at ${k(...n)}`);
    assert.ok(inTreasure(n) && fall <= MAX_FALL, `drop from ${k(...c)} lands at ${k(...n)} after ${fall}`);
  }
  // And the way back: from the island floor, a ladder to the main level.
  const island = STANDABLE.find((c) => inTreasure(c) && !isLadder(at(...c)));
  const back = reach(island);
  assert.ok(back.cells.some(([x, y, z]) => y > ISLAND_FEET + 1 && !onIsland(x, z)), 'the island has no way up');
  assert.ok(named('minecraft:ladder').length >= 2, 'no ladder out of the treasure room');
});
