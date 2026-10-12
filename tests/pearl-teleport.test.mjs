// The bound use (spec v3 §7, bound state; L0-xasm42, L0-pear-pr03, L0-pear-ru01, L0-pear-ru02, L0-adr-prta), off the
// engine: the outcome table row by row, the safe-spot rule, the world area budget, and src/pearl/teleport.ts against a
// stand-in @minecraft/server — every outcome ends with the area removed and the slot back in the budget.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asModule = (text) => import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));
const bundle = (file) =>
  build({ entryPoints: [join(root, ...file.split('/'))], bundle: true, format: 'esm', platform: 'neutral', write: false, external: ['@minecraft/*'] });

const rulesBundle = await bundle('src/pearl/teleport-rules.ts');
const poolBundle = await bundle('src/pearl/area-pool.ts');
const ringBundle = await bundle('src/structures/search-ring.ts');
const T = await asModule(rulesBundle.outputFiles[0].text);
const P = await asModule(poolBundle.outputFiles[0].text);
const Ring = await asModule(ringBundle.outputFiles[0].text);

const langKeys = (lang) =>
  new Set(
    readFileSync(join(root, 'packs', 'resource', 'texts', `${lang}.lang`), 'utf-8')
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => l.slice(0, l.indexOf('=')))
  );

test('the rules and the budget import nothing from the engine', () => {
  assert.doesNotMatch(rulesBundle.outputFiles[0].text, /@minecraft\//);
  assert.doesNotMatch(poolBundle.outputFiles[0].text, /@minecraft\//);
});

// ------------------------------------------------------------------ xasm42, row by row

const PLATE = { x: 100, y: 64, z: -20 };
const BINDING = { dim: 'minecraft:overworld', pos: PLATE, type: 'minecraft:stone_pressure_plate', owner: 'id-owner', epoch: 3, gen: 2 };
const OWNER = { id: 'id-owner', epoch: 3 };
const SPOT = { x: 100, y: 64, z: -20 };
const fine = { rodFound: true, cellType: 'minecraft:stone_pressure_plate', gen: 2, spot: SPOT };

test('row 1 — the owner, the same epoch, everything valid: no cast, teleport, binding cleared, arrival line', () => {
  assert.equal(T.useVerdict(BINDING, OWNER, false), 'travel');
  assert.equal(T.dimensionVerdict('minecraft:overworld', 'minecraft:overworld', true), 'go');
  assert.equal(T.waitVerdict({ online: true, alive: true, loaded: true, tick: 5, deadline: 200 }), 'validate');
  assert.equal(T.destinationVerdict(BINDING, fine), 'teleport');
  assert.equal(T.arrivalVerdict({ x: 100.5, y: 64, z: -19.5 }, 'minecraft:overworld', 'minecraft:overworld', { x: 100.5, y: 64, z: -19.5 }), 'arrived');
  assert.deepEqual(T.OUTCOMES.arrived, { teleport: true, binding: 'clear', message: 'andrew.pearl_rod.arrived' });
});

test('row 2 — the plate is missing, another type, or has a bumped generation: no teleport, binding cleared, "bind again"', () => {
  assert.equal(T.destinationVerdict(BINDING, { ...fine, cellType: 'minecraft:air' }), 'plate-gone', 'missing');
  assert.equal(T.destinationVerdict(BINDING, { ...fine, cellType: 'minecraft:birch_pressure_plate' }), 'plate-gone', 'another plate type');
  assert.equal(T.destinationVerdict(BINDING, { ...fine, cellType: 'minecraft:stone' }), 'plate-gone', 'not a plate at all');
  assert.equal(T.destinationVerdict(BINDING, { ...fine, gen: 3 }), 'plate-gone', 'generation bumped (xcx34)');
  assert.equal(T.destinationVerdict(BINDING, { ...fine, spot: undefined, gen: 3 }), 'plate-gone', 'a gone plate is reported as gone, not as unsafe');
  assert.deepEqual(T.OUTCOMES['plate-gone'], { teleport: false, binding: 'clear', message: 'andrew.pearl_rod.plate_gone' });
});

test('row 3 — preload timed out, pool full, dimension refused: no teleport, binding kept, the specific reason', () => {
  assert.equal(T.PRELOAD_TIMEOUT_TICKS, 200, '10 s');
  assert.equal(T.waitVerdict({ online: true, alive: true, loaded: false, tick: 199, deadline: 200 }), 'wait');
  assert.equal(T.waitVerdict({ online: true, alive: true, loaded: false, tick: 200, deadline: 200 }), 'not-loaded');
  assert.equal(T.waitVerdict({ online: true, alive: true, loaded: true, tick: 200, deadline: 200 }), 'validate', 'loaded on the last tick still goes');
  assert.equal(T.dimensionVerdict('minecraft:overworld', 'andrew:nowhere', false), 'dimension-refused', 'unknown dimension');
  assert.equal(T.dimensionVerdict('minecraft:overworld', 'minecraft:nether', true, false), 'dimension-refused', 'cross-dimension switched off');
  assert.equal(T.dimensionVerdict('minecraft:overworld', 'minecraft:nether', true), 'go', 'probe Q6: cross-dimension is on');
  assert.equal(T.CROSS_DIMENSION_ALLOWED, true);
  for (const [o, key] of [['not-loaded', 'not_loaded'], ['busy', 'busy'], ['dimension-refused', 'dimension_refused']]) {
    assert.deepEqual(T.OUTCOMES[o], { teleport: false, binding: 'keep', message: `andrew.pearl_rod.${key}` }, o);
  }
});

test('row 4 — no safe spot at the plate or its 8 neighbours: no teleport, binding kept, "destination unsafe"', () => {
  assert.equal(T.destinationVerdict(BINDING, { ...fine, spot: undefined }), 'unsafe');
  assert.deepEqual(T.OUTCOMES.unsafe, { teleport: false, binding: 'keep', message: 'andrew.pearl_rod.unsafe' });
});

test('row 5 — the owner with a teleport already pending: no cast, no teleport, unchanged, "already travelling"', () => {
  assert.equal(T.useVerdict(BINDING, OWNER, true), 'travelling');
  assert.deepEqual(T.OUTCOMES.travelling, { teleport: false, binding: 'keep', message: 'andrew.pearl_rod.travelling' });
});

test('row 6 — the owner dies, or dies while the teleport is pending: aborted, no message', () => {
  assert.equal(T.waitVerdict({ online: true, alive: false, loaded: true, tick: 5, deadline: 200 }), 'died', 'death beats a loaded destination');
  assert.equal(T.waitVerdict({ online: false, alive: false, loaded: false, tick: 5, deadline: 200 }), 'offline');
  assert.deepEqual(T.OUTCOMES.died, { teleport: false, binding: 'keep', message: undefined });
  assert.deepEqual(T.OUTCOMES.offline, { teleport: false, binding: 'keep', message: undefined });
});

test('row 7 — a non-owner, or the owner after a death: a vanilla cast, the binding unchanged', () => {
  assert.equal(T.useVerdict(BINDING, { id: 'id-stranger', epoch: 3 }, false), 'vanilla');
  assert.equal(T.useVerdict(BINDING, { id: 'id-owner', epoch: 4 }, false), 'vanilla', 'epoch moved on: a death since the binding');
  assert.equal(T.useVerdict(BINDING, { id: 'id-stranger', epoch: 3 }, true), 'vanilla', 'even while the stranger travels on another rod');
  assert.equal(T.useVerdict(undefined, OWNER, false), 'vanilla', 'an unbound rod');
});

test('row 8 — the owner is riding: the same verdicts as row 1 (the engine half dismounts; see the stand-in test)', () => {
  assert.equal(T.useVerdict(BINDING, OWNER, false), 'travel');
  assert.equal(T.destinationVerdict(BINDING, fine), 'teleport');
});

test('L0-pear-pr03 keep rows: the rod left the inventory, the read-back mismatched', () => {
  assert.equal(T.destinationVerdict(BINDING, { ...fine, rodFound: false, cellType: 'minecraft:air' }), 'rod-left', 'checked before the plate: nothing to clear');
  assert.equal(T.destinationVerdict(BINDING, { ...fine, cellType: undefined }), 'not-loaded', 'a cell that does not answer is never read as a gone plate');
  const want = { x: 100.5, y: 64, z: -19.5 };
  assert.equal(T.arrivalVerdict(want, 'minecraft:overworld', 'minecraft:nether', want), 'failed', 'wrong dimension');
  assert.equal(T.arrivalVerdict(want, 'minecraft:overworld', 'minecraft:overworld', { x: 100.5, y: 64.5, z: -19.5 }), 'failed', 'off by 0.5');
  assert.equal(T.arrivalVerdict(want, 'minecraft:overworld', 'minecraft:overworld', { x: 100.5, y: 64.49, z: -19.5 }), 'arrived');
  assert.deepEqual(T.OUTCOMES['rod-left'], { teleport: false, binding: 'keep', message: 'andrew.pearl_rod.rod_left' });
  assert.deepEqual(T.OUTCOMES.failed, { teleport: false, binding: 'keep', message: 'andrew.pearl_rod.failed' });
});

test('honesty: only "arrived" moves the player or speaks of arriving; every other outcome keeps or clears and says why', () => {
  for (const [o, rule] of Object.entries(T.OUTCOMES)) {
    if (o === 'arrived') continue;
    assert.equal(rule.teleport, false, o);
    assert.notEqual(rule.message, T.OUTCOMES.arrived.message, o);
  }
  const clears = Object.entries(T.OUTCOMES).filter(([, r]) => r.binding === 'clear').map(([o]) => o).sort();
  assert.deepEqual(clears, ['arrived', 'plate-gone'], 'L0-pear-ru01 §3: only success and a dead plate clear');
  const en = langKeys('en_US');
  const ru = langKeys('ru_RU');
  for (const [o, rule] of Object.entries(T.OUTCOMES)) {
    if (rule.message === undefined) continue;
    assert.ok(en.has(rule.message), `en_US.lang lacks ${rule.message} (${o})`);
    assert.ok(ru.has(rule.message), `ru_RU.lang lacks ${rule.message} (${o})`);
  }
});

// ------------------------------------------------------------------ the safe spot (L0-pear-ru02)

const AIR = { typeId: 'minecraft:air', isAir: true, isLiquid: false, isWaterlogged: false };
const cell = (typeId, extra = {}) => ({ typeId, isAir: typeId === 'minecraft:air', isLiquid: /water|lava/.test(typeId), isWaterlogged: false, ...extra });
const RANGE = { min: -64, max: 320 };
const k = (c) => `${c.x},${c.y},${c.z}`;

/** A 3×3 stone floor under PLATE, air above it, the plate in the middle; `edits` override cells by "x,y,z". */
function site(edits = {}) {
  const m = new Map();
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      m.set(k({ x: PLATE.x + dx, y: PLATE.y - 1, z: PLATE.z + dz }), cell('minecraft:stone'));
    }
  m.set(k(PLATE), cell('minecraft:stone_pressure_plate'));
  for (const [key, v] of Object.entries(edits)) m.set(key, v);
  return (at) => (at.y < RANGE.min || at.y >= RANGE.max ? undefined : m.get(k(at)) ?? AIR);
}
const at = (dx, dy, dz) => k({ x: PLATE.x + dx, y: PLATE.y + dy, z: PLATE.z + dz });

test('candidates: the plate cell first, then N, E, S, W, NE, SE, SW, NW (north is −z); no vertical search', () => {
  const c = T.spotCandidates(PLATE);
  assert.equal(c.length, 9);
  assert.deepEqual(c[0], PLATE);
  assert.deepEqual(c.slice(1).map((p) => [p.x - PLATE.x, p.z - PLATE.z]), [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]]);
  assert.ok(c.every((p) => p.y === PLATE.y));
});

test('an open plate: the player arrives on the plate itself, at the cell centre', () => {
  assert.deepEqual(T.findSafeSpot(PLATE, site(), RANGE), PLATE);
  assert.deepEqual(T.arrivalPoint(PLATE), { x: 100.5, y: 64, z: -19.5 });
});

test('suffocation: a block in the head cell rules the plate out; the first open neighbour in order is taken', () => {
  assert.deepEqual(T.findSafeSpot(PLATE, site({ [at(0, 1, 0)]: cell('minecraft:stone') }), RANGE), { x: 100, y: 64, z: -21 }, 'north');
  const walled = {};
  for (const [dx, dz] of T.spotCandidates({ x: 0, y: 0, z: 0 }).map((c) => [c.x, c.z])) walled[at(dx, 1, dz)] = cell('minecraft:stone');
  assert.equal(T.findSafeSpot(PLATE, site(walled), RANGE), undefined, 'a 1-high slot everywhere');
  delete walled[at(-1, 1, 0)];
  assert.deepEqual(T.findSafeSpot(PLATE, site(walled), RANGE), { x: 99, y: 64, z: -20 }, 'only west is open');
  assert.equal(T.findSafeSpot(PLATE, site({ ...walled, [at(-1, 0, 0)]: cell('minecraft:dirt') }), RANGE), undefined, 'a block in the feet cell');
});

test('lava, fire and water in the body are unsafe; so is lava, magma or air under the feet (the void)', () => {
  const ceiling = { [at(0, 1, 0)]: cell('minecraft:stone') };
  for (const hazard of ['minecraft:lava', 'minecraft:flowing_lava', 'minecraft:fire', 'minecraft:soul_fire', 'minecraft:water', 'minecraft:sweet_berry_bush', 'minecraft:wither_rose', 'minecraft:powder_snow', 'minecraft:web', 'minecraft:cactus']) {
    const edits = { ...ceiling };
    for (const [dx, dz] of T.NEIGHBOUR_ORDER) edits[at(dx, 0, dz)] = cell(hazard);
    assert.equal(T.findSafeSpot(PLATE, site(edits), RANGE), undefined, `${hazard} in every neighbour's feet`);
    const head = { ...ceiling };
    for (const [dx, dz] of T.NEIGHBOUR_ORDER) head[at(dx, 1, dz)] = cell(hazard);
    assert.equal(T.findSafeSpot(PLATE, site(head), RANGE), undefined, `${hazard} in every neighbour's head`);
  }
  for (const floor of ['minecraft:air', 'minecraft:lava', 'minecraft:water', 'minecraft:magma', 'minecraft:campfire', 'minecraft:cactus', 'minecraft:scaffolding', 'minecraft:oak_fence', 'minecraft:cobblestone_wall', 'minecraft:stone_pressure_plate', 'minecraft:white_carpet', 'minecraft:rail']) {
    const edits = { ...ceiling };
    for (const [dx, dz] of T.NEIGHBOUR_ORDER) edits[at(dx, -1, dz)] = cell(floor);
    assert.equal(T.findSafeSpot(PLATE, site(edits), RANGE), undefined, `${floor} under every neighbour`);
  }
  assert.equal(T.findSafeSpot(PLATE, site({ [at(0, -1, 0)]: cell('minecraft:magma'), ...Object.fromEntries(T.NEIGHBOUR_ORDER.map(([dx, dz]) => [at(dx, -1, dz), AIR])) }), RANGE), undefined, 'a plate on magma');
  const silent = (miss) => (c) => (k(c) === miss ? undefined : site()(c));
  assert.equal(T.isSafeSpot(PLATE, silent(k(PLATE)), RANGE), false, 'feet that do not answer');
  assert.equal(T.isSafeSpot(PLATE, silent(at(0, 1, 0)), RANGE), false, 'a head that does not answer');
  assert.equal(T.isSafeSpot(PLATE, silent(at(0, -1, 0)), RANGE), false, 'a floor that does not answer');
});

test('passable cells: plates, carpets, signs, torches, buttons, one snow layer, flowers, grass, light blocks; not two layers', () => {
  for (const id of ['minecraft:air', 'minecraft:birch_pressure_plate', 'minecraft:white_carpet', 'minecraft:moss_carpet', 'minecraft:oak_hanging_sign', 'minecraft:wall_sign',
    'minecraft:torch', 'minecraft:soul_torch', 'minecraft:redstone_torch', 'minecraft:stone_button', 'minecraft:poppy', 'minecraft:short_grass', 'minecraft:tall_grass',
    'minecraft:light_block_15']) {
    assert.ok(T.isPassable(cell(id)), id);
  }
  assert.ok(T.isPassable(cell('minecraft:snow_layer', { snowHeight: 0 })), 'one layer');
  assert.ok(!T.isPassable(cell('minecraft:snow_layer', { snowHeight: 1 })), 'two layers');
  assert.ok(!T.isPassable(cell('minecraft:oak_wall_sign', { isWaterlogged: true })), 'waterlogged');
  for (const id of ['minecraft:stone', 'minecraft:glass', 'minecraft:oak_slab', 'minecraft:chest', 'andrew:anything_carpet', 'minecraft:lava', 'minecraft:water']) {
    assert.ok(!T.isPassable(cell(id)), id);
  }
  assert.ok(!T.isPassable(undefined));
});

test('the dimension edges: the floor at the bottom row and the head at the top are outside the range', () => {
  const low = { x: 0, y: RANGE.min, z: 0 };
  assert.equal(T.isSafeSpot(low, () => AIR, RANGE), false);
  const top = { x: 0, y: RANGE.max - 1, z: 0 };
  assert.equal(T.isSafeSpot(top, (c) => (c.y === top.y - 1 ? cell('minecraft:stone') : AIR), RANGE), false);
  const ok = { x: 0, y: RANGE.max - 2, z: 0 };
  assert.equal(T.isSafeSpot(ok, (c) => (c.y === ok.y - 1 ? cell('minecraft:stone') : AIR), RANGE), true);
});

test('the preload covers the plate column and its 8 neighbours', () => {
  assert.deepEqual(T.preloadBox(PLATE), { min: [99, -21], max: [101, -19] });
  assert.equal(T.preloadCells(PLATE).length, 9);
  for (const c of T.spotCandidates(PLATE)) assert.ok(T.preloadCells(PLATE).some((p) => p.x === c.x && p.z === c.z));
});

// ------------------------------------------------------------------ the world area budget (L0-adr-prta)

test('the budget: structures share all but the reserved slot; the rod takes the reserve, then borrows', () => {
  assert.equal(P.WORLD_AREA_CAP, 10);
  assert.equal(P.GAMETEST_AREA_CAP, 9);
  assert.equal(P.PEARL_RESERVED_SLOTS, 1);
  const b = new P.AreaBudget();
  const s = [];
  for (let i = 0; i < 20; i++) {
    const l = b.tryAcquire('structure');
    if (l) s.push(l);
  }
  assert.equal(s.length, 9, 'structures stop at 9 of 10');
  assert.equal(b.refused.structure, 11);
  const rod = b.tryAcquire('pearl');
  assert.ok(rod, 'the reserved slot is there while every structure slot is taken');
  assert.equal(b.tryAcquire('pearl'), undefined, 'a second trip finds the world full');
  assert.equal(b.refused.pearl, 1);
  s.pop().release();
  s.pop().release();
  const borrowed = b.tryAcquire('pearl');
  assert.ok(borrowed, 'the rod borrows a free unreserved slot');
  assert.equal(b.held('pearl'), 2);
  const last = b.tryAcquire('structure');
  assert.ok(last, 'with the rod in its reserve plus one, a structure may take the last free slot: 8 structures, 2 rod');
  assert.equal(b.tryAcquire('structure'), undefined, 'the world is full');
  last.release();
  rod.release();
  rod.release();
  assert.equal(b.held('pearl'), 1, 'release is idempotent');
  borrowed.release();
  for (const l of s) l.release();
  assert.equal(b.held(), 0);
});

test('canAcquire, the rule alone', () => {
  assert.equal(P.canAcquire('structure', { structure: 8, pearl: 0 }, 10, 1), true);
  assert.equal(P.canAcquire('structure', { structure: 9, pearl: 0 }, 10, 1), false);
  assert.equal(P.canAcquire('structure', { structure: 8, pearl: 1 }, 10, 1), true, 'the rod in its reserved slot leaves structures their 9');
  assert.equal(P.canAcquire('structure', { structure: 8, pearl: 2 }, 10, 1), false, 'a borrowed slot is the rod\'s until released');
  assert.equal(P.canAcquire('pearl', { structure: 9, pearl: 0 }, 10, 1), true);
  assert.equal(P.canAcquire('pearl', { structure: 9, pearl: 1 }, 10, 1), false);
  assert.equal(P.canAcquire('pearl', { structure: 0, pearl: 9 }, 10, 1), true, 'the rod may hold every slot');
  assert.equal(P.canAcquire('structure', { structure: 7, pearl: 0 }, 9, 1), true, 'inside GameTest');
  assert.equal(P.canAcquire('structure', { structure: 8, pearl: 0 }, 9, 1), false);
});

test('the ring loader takes its slots from the budget, gives them back on remove, and never touches the reserve', async () => {
  const cmds = [];
  const dim = {
    heightRange: { min: -64 },
    runCommand: (c) => (cmds.push(c), { successCount: 1 }),
    isChunkLoaded: () => true,
    getBlock: () => ({}),
  };
  const sys = { runTimeout: (cb, ticks) => setTimeout(cb, ticks) };
  const budget = new P.AreaBudget(10, 1);
  const loaders = [Ring.engineRingLoader(dim, sys, 'r_o', 4, budget), Ring.engineRingLoader(dim, sys, 'r_n', 4, budget), Ring.engineRingLoader(dim, sys, 'r_e', 4, budget)];
  const removers = await Promise.all(loaders.flatMap((l) => [0, 1, 2].map((i) => l.load([i * 16, 0], [i * 16 + 15, 15]))));
  const held = removers.filter(Boolean);
  assert.equal(held.length, 9, 'three loaders asking for 9 slots get 9');
  assert.equal(budget.held('structure'), 9);
  const extra = Ring.engineRingLoader(dim, sys, 'r_x', 4, budget).load([0, 0], [15, 15]);
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(budget.held('structure'), 9, 'a tenth waits: the reserve is not handed out');
  assert.ok(budget.tryAcquire('pearl'), 'the rod still finds its slot');
  held[0]();
  assert.equal(await extra !== undefined, true, 'the waiting load gets the freed structure slot');
  assert.equal(budget.held('structure'), 9);
  const adds = cmds.filter((c) => c.startsWith('tickingarea add')).length;
  assert.equal(adds, 10, 'no add reached the engine without a slot');
  const unbudgeted = Ring.engineRingLoader(dim, sys, 'r_u', 4);
  assert.ok(await unbudgeted.load([0, 0], [15, 15]), 'without a budget the loader behaves as before');
});

// ------------------------------------------------------------------ teleport.ts on a stand-in engine

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = (globalThis.__tp = { tick: 0, queue: [], intervals: [], worldDp: new Map(), dims: new Map() });
        export class Player {}
        export class ItemStack {
          constructor(typeId, amount = 1) {
            this.typeId = typeId; this.amount = amount; this.nameTag = undefined; this.lore = []; this.dp = new Map();
            this.maxAmount = typeId === 'minecraft:fishing_rod' ? 1 : 64;
            this.durability = typeId === 'minecraft:fishing_rod' ? { damage: 0, maxDurability: 384 } : undefined;
          }
          clone() {
            const c = Object.create(ItemStack.prototype);
            Object.assign(c, this, { lore: [...this.lore], dp: new Map(this.dp), durability: this.durability && { ...this.durability } });
            return c;
          }
          setLore(l) { this.lore = [...l]; }
          getLore() { return [...this.lore]; }
          setDynamicProperty(k, v) { if (this.maxAmount !== 1) throw new Error('stackable'); if (v === undefined) this.dp.delete(k); else this.dp.set(k, v); }
          getDynamicProperty(k) { if (this.maxAmount !== 1) throw new Error('stackable'); return this.dp.get(k); }
          getComponent(id) { return id === 'minecraft:durability' ? this.durability : undefined; }
        }
        const sub = (name) => ({ subscribe(cb, opts) { H[name] = cb; H[name + 'Opts'] = opts; return cb; } });
        export const world = {
          getAbsoluteTime: () => 99,
          getAllPlayers: () => [],
          getDynamicProperty: (k) => H.worldDp.get(k),
          getDimension(id) {
            const d = H.dims.get(id.includes(':') ? id : 'minecraft:' + id);
            if (d === undefined) throw new Error('unknown dimension ' + id);
            return d;
          },
          beforeEvents: { itemUse: sub('use') },
          afterEvents: {
            entityDie: sub('die'),
            playerInventoryItemChange: sub('invChange'),
            itemUse: sub('afterUse'),
            entitySpawn: sub('spawn'),
            projectileHitEntity: sub('hitEntity'),
          },
        };
        export const system = {
          get currentTick() { return H.tick; },
          run(cb) { H.queue.push(cb); },
          runTimeout() {},
          runInterval(cb, t) { H.intervals.push([cb, t]); },
        };
      `,
    }));
  },
};

const tpBundle = await build({
  stdin: {
    contents: [
      "export * from './src/pearl/teleport.ts';",
      "export { AreaBudget } from './src/pearl/area-pool.ts';",
      "export { bindingOf } from './src/pearl/bind.ts';",
      "export { bindingEntries } from './src/pearl/bind-rules.ts';",
      "export { makePearlRod } from './src/pearl/item.ts';",
      "export { ItemStack, Player } from '@minecraft/server';",
    ].join('\n'),
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [stubPlugin],
});
const E = await asModule(tpBundle.outputFiles[0].text);
const H = globalThis.__tp;

/** A stand-in dimension: blocks by "x,y,z", ticking areas by name; a cell loads `loadTicks` after an area covers it. */
function fakeDim(id, opts = {}) {
  const d = {
    id,
    heightRange: { min: -64, max: 320 },
    blocks: new Map(),
    areas: new Map(),
    commands: [],
    sounds: [],
    loadTicks: opts.loadTicks ?? 2,
    neverLoads: false,
    refuseAdds: false,
    loadedAlways: opts.loadedAlways ?? false,
    runCommand(cmd) {
      this.commands.push(cmd);
      const add = cmd.match(/^tickingarea add (-?\d+) 0 (-?\d+) (-?\d+) 0 (-?\d+) (\S+)$/);
      if (add) {
        if (this.refuseAdds || this.areas.has(add[5])) return { successCount: 0 };
        this.areas.set(add[5], { x0: +add[1], z0: +add[2], x1: +add[3], z1: +add[4], at: H.tick });
        return { successCount: 1 };
      }
      const rm = cmd.match(/^tickingarea remove (\S+)$/);
      if (rm) return { successCount: this.areas.delete(rm[1]) ? 1 : 0 };
      return { successCount: 0 };
    },
    isChunkLoaded(c) {
      if (this.loadedAlways) return true;
      if (this.neverLoads) return false;
      for (const a of this.areas.values()) if (c.x >= a.x0 && c.x <= a.x1 && c.z >= a.z0 && c.z <= a.z1 && H.tick - a.at >= this.loadTicks) return true;
      return false;
    },
    getBlock(c) {
      if (c.y < this.heightRange.min || c.y >= this.heightRange.max) throw new Error('out of range');
      if (!this.isChunkLoaded(c)) return undefined;
      const typeId = this.blocks.get(`${c.x},${c.y},${c.z}`) ?? 'minecraft:air';
      return { typeId, isAir: typeId === 'minecraft:air', isLiquid: /water|lava/.test(typeId), isWaterlogged: false, permutation: { getState: () => undefined } };
    },
    playSound(s, at) { this.sounds.push([s, at]); },
  };
  H.dims.set(id, d);
  return d;
}

const overworld = fakeDim('minecraft:overworld');
const nether = fakeDim('minecraft:nether', { loadTicks: 9 });
fakeDim('minecraft:the_end');
const allDims = [...H.dims.values()];

/** A 3×3 stone floor under the plate cell and air above: an open landing pad. */
function pad(dim, p, type = 'minecraft:stone_pressure_plate') {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) dim.blocks.set(`${p.x + dx},${p.y - 1},${p.z + dz}`, 'minecraft:stone');
  dim.blocks.set(`${p.x},${p.y},${p.z}`, type);
}

function fakePlayer(name, opts = {}) {
  const items = new Array(36).fill(undefined);
  const container = { size: 36, getItem: (i) => items[i]?.clone(), setItem: (i, s) => { items[i] = s?.clone(); } };
  const p = Object.assign(new E.Player(), {
    name, id: `id-${name}`, isValid: true, selectedSlotIndex: 0, items, bars: [], epoch: opts.epoch ?? 0, health: 20,
    dimension: opts.dim ?? overworld, location: opts.at ?? { x: 0.5, y: 64, z: 0.5 }, riding: undefined, teleports: [], stuck: false,
    getComponent(id) {
      if (id === 'minecraft:inventory') return { container };
      if (id === 'minecraft:riding') return this.riding === undefined ? undefined : { entityRidingOn: this.riding };
      if (id === 'minecraft:health') return { currentValue: this.health };
      return undefined;
    },
    getDynamicProperty(k) { return k === 'andrew:life_epoch' ? this.epoch : undefined; },
    onScreenDisplay: { setActionBar: (m) => p.bars.push(m.translate) },
    teleport(to, o) {
      this.teleports.push({ to: { ...to }, dim: o?.dimension?.id, riding: this.riding !== undefined });
      if (this.stuck) return;
      this.location = { ...to };
      if (o?.dimension) this.dimension = o.dimension;
    },
  });
  return p;
}

/** A Pearl Rod bound to `pos` by `owner` in `slot`. */
function boundRod(owner, dim, pos, type = 'minecraft:stone_pressure_plate', extra = {}) {
  const rod = E.makePearlRod();
  const b = { dim: dim.id, pos, type, owner: owner.id, epoch: owner.epoch, gen: 0, ...extra };
  for (const [key, value] of E.bindingEntries(b)) rod.setDynamicProperty(key, value);
  rod.setLore(['Pearl Rod', `bound: ${dim.id.slice(10)} ${pos.x} ${pos.y} ${pos.z}`]);
  return rod;
}

const budget = new E.AreaBudget(10, 1);
E.registerPearlTeleport({ areas: budget, areaPrefix: 'andrew_pearl_' });

function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    H.tick++;
    for (const cb of H.queue.splice(0)) cb();
    for (const [cb, every] of H.intervals) if (H.tick % every === 0) cb();
  }
}

/** One use of the item in `slot`; true when the module cancelled it (no cast). */
function use(p, slot = 0) {
  const ev = { source: p, itemStack: p.items[slot].clone(), cancel: false };
  H.use(ev);
  return ev.cancel;
}

/** Ticks until the player's trip ends with an outcome newer than `since`; "already travelling" ends no trip. */
function until(p, since, max = 400) {
  for (let i = 0; i < max; i++) {
    const o = E.lastOutcome.get(p.id);
    if (o !== undefined && o.tick > since && o.outcome !== 'travelling') return o;
    tick();
  }
  throw new Error(`no outcome for ${p.name} in ${max} ticks`);
}

const areasLeft = () => allDims.reduce((n, d) => n + d.areas.size, 0);
const clean = (what) => {
  assert.equal(areasLeft(), 0, `${what}: an area is left in the world`);
  assert.equal(budget.held(), 0, `${what}: a slot is still held in the budget`);
  assert.equal(E.pendingTrips(), 0, `${what}: a trip is still pending`);
  assert.deepEqual(E.heldAreaNames(), [], `${what}: the module still holds a name`);
};

test('the startup sweep removes every name of this pack in all three dimensions, once', () => {
  tick();
  for (const d of allDims) {
    const removes = d.commands.filter((c) => c.startsWith('tickingarea remove andrew_pearl_'));
    assert.equal(removes.length, 10, d.id);
  }
  assert.equal(H.dieOpts?.entityTypes?.[0], 'minecraft:player');
});

test('success: the use is cancelled, the plate preloaded, the player moved onto it; binding cleared, area removed', () => {
  const p = fakePlayer('near', { epoch: 2 });
  const plate = { x: 40, y: 64, z: 12 };
  pad(overworld, plate);
  p.items[0] = boundRod(p, overworld, plate);
  const t0 = H.tick;
  assert.equal(use(p), true, 'no cast');
  const o = until(p, t0);
  assert.equal(o.outcome, 'arrived');
  assert.deepEqual(p.location, { x: 40.5, y: 64, z: 12.5 });
  assert.equal(E.bindingOf(p.items[0]), undefined, 'binding cleared');
  assert.deepEqual(p.items[0].getLore(), ['Pearl Rod', 'unbound']);
  assert.ok(typeof p.items[0].getDynamicProperty('andrew:pearl_rod') === 'string', 'still a Pearl Rod');
  assert.deepEqual(p.bars, ['andrew.pearl_rod.arrived']);
  assert.deepEqual(overworld.sounds.at(-1), ['mob.endermen.portal', { x: 40.5, y: 64, z: 12.5 }]);
  assert.ok(overworld.commands.includes('tickingarea add 39 0 11 41 0 13 andrew_pearl_0'), 'the 3×3 columns around the plate');
  clean('success');
  assert.equal(use(p), false, 'the next use is a vanilla cast');
});

test('no distance limit and another dimension: a plate 1 000 000 blocks out, and one in the Nether', () => {
  const far = fakePlayer('far');
  const plate = { x: 1_000_000, y: 70, z: -999_999 };
  pad(overworld, plate);
  far.items[3] = boundRod(far, overworld, plate);
  far.selectedSlotIndex = 3;
  let t0 = H.tick;
  assert.equal(use(far, 3), true);
  assert.equal(until(far, t0).outcome, 'arrived');
  assert.deepEqual(far.location, { x: 1_000_000.5, y: 70, z: -999_998.5 });
  clean('far');

  const traveller = fakePlayer('cross');
  const np = { x: 2000, y: 70, z: 0 };
  pad(nether, np);
  traveller.items[0] = boundRod(traveller, nether, np);
  t0 = H.tick;
  use(traveller);
  const o = until(traveller, t0);
  assert.equal(o.outcome, 'arrived');
  assert.ok(o.tick - t0 >= 9, 'waited for the Nether preload');
  assert.equal(traveller.dimension.id, 'minecraft:nether');
  assert.equal(traveller.teleports[0].dim, 'minecraft:nether');
  assert.ok(nether.commands.includes('tickingarea add 1999 0 -1 2001 0 1 andrew_pearl_0'), 'the area is added in the destination dimension');
  clean('cross-dimension');
});

test('row 2 on the engine: a missing, a replaced and a re-generated plate clear the binding without moving the player', () => {
  for (const [label, edit] of [
    ['missing', (pl) => overworld.blocks.set(`${pl.x},${pl.y},${pl.z}`, 'minecraft:air')],
    ['other type', (pl) => overworld.blocks.set(`${pl.x},${pl.y},${pl.z}`, 'minecraft:birch_pressure_plate')],
    ['generation', (pl) => H.worldDp.set(`andrew:pg:overworld:${pl.x}:${pl.y}:${pl.z}`, 1)],
  ]) {
    const p = fakePlayer(`gone_${label}`);
    const plate = { x: 300 + p.name.length * 10, y: 64, z: 300 };
    pad(overworld, plate);
    p.items[0] = boundRod(p, overworld, plate);
    edit(plate);
    const before = { ...p.location };
    const t0 = H.tick;
    assert.equal(use(p), true);
    assert.equal(until(p, t0).outcome, 'plate-gone', label);
    assert.deepEqual(p.location, before, `${label}: not moved`);
    assert.equal(p.teleports.length, 0);
    assert.equal(E.bindingOf(p.items[0]), undefined, `${label}: binding cleared`);
    assert.deepEqual(p.items[0].getLore(), ['Pearl Rod', 'unbound']);
    assert.deepEqual(p.bars, ['andrew.pearl_rod.plate_gone']);
    clean(label);
    assert.equal(use(p), false, `${label}: the next use casts`);
  }
  H.worldDp.clear();
});

function keptAfter(p, outcome, message) {
  const b = E.bindingOf(p.items[0]);
  assert.ok(b !== undefined, `${outcome}: binding kept`);
  assert.equal(p.teleports.length, 0, `${outcome}: not moved`);
  assert.equal(p.bars.at(-1), message, `${outcome}: message`);
  assert.ok(!p.bars.includes('andrew.pearl_rod.arrived'), `${outcome}: no arrival claimed`);
  assert.ok(p.items[0].getLore()[1].startsWith('bound: '), `${outcome}: lore still bound`);
}

test('row 4 on the engine: no safe spot keeps the binding and says so; opening one neighbour lets the next use through', () => {
  const p = fakePlayer('unsafe');
  const plate = { x: 500, y: 64, z: 0 };
  pad(overworld, plate);
  for (const c of [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]]) overworld.blocks.set(`${plate.x + c[0]},${plate.y + 1},${plate.z + c[1]}`, 'minecraft:stone');
  p.items[0] = boundRod(p, overworld, plate);
  let t0 = H.tick;
  use(p);
  assert.equal(until(p, t0).outcome, 'unsafe');
  keptAfter(p, 'unsafe', 'andrew.pearl_rod.unsafe');
  clean('unsafe');
  overworld.blocks.delete(`${plate.x - 1},${plate.y + 1},${plate.z}`);
  t0 = H.tick;
  assert.equal(use(p), true, 'the kept binding is still honoured');
  assert.equal(until(p, t0).outcome, 'arrived');
  assert.deepEqual(p.location, { x: 499.5, y: 64, z: 0.5 }, 'west, the only open neighbour');
  clean('unsafe, then open');
});

test('row 3 on the engine: a destination that never loads times out at 200 ticks; the binding is kept', () => {
  const p = fakePlayer('timeout');
  const plate = { x: 700, y: 64, z: 0 };
  pad(overworld, plate);
  p.items[0] = boundRod(p, overworld, plate);
  overworld.neverLoads = true;
  const t0 = H.tick;
  use(p);
  tick(2);
  assert.equal(E.heldAreaNames().length, 1, 'the area is held while waiting');
  assert.equal(budget.held('pearl'), 1);
  const o = until(p, t0, 400);
  overworld.neverLoads = false;
  assert.equal(o.outcome, 'not-loaded');
  assert.equal(o.tick - (t0 + 1), 200, 'the deadline counts from the start tick');
  keptAfter(p, 'not-loaded', 'andrew.pearl_rod.not_loaded');
  clean('timeout');
});

test('row 3 on the engine: a full budget and an engine refusal are both "busy"; the slot is never kept', () => {
  const p = fakePlayer('busy');
  const plate = { x: 900, y: 64, z: 0 };
  pad(overworld, plate);
  p.items[0] = boundRod(p, overworld, plate);
  const held = [];
  for (let i = 0; i < 10; i++) {
    const l = budget.tryAcquire(i < 9 ? 'structure' : 'pearl');
    if (l) held.push(l);
  }
  assert.equal(held.length, 10, 'the world is full: 9 structures and another trip in the reserve');
  let t0 = H.tick;
  use(p);
  assert.equal(until(p, t0).outcome, 'busy');
  assert.match(E.lastOutcome.get(p.id).detail, /budget is full/);
  keptAfter(p, 'busy', 'andrew.pearl_rod.busy');
  assert.equal(overworld.commands.filter((c) => c.includes('tickingarea add') && c.includes('899')).length, 0, 'the refused request never reached the engine');
  for (const l of held) l.release();

  overworld.refuseAdds = true;
  t0 = H.tick;
  use(p);
  assert.equal(until(p, t0).outcome, 'busy');
  assert.match(E.lastOutcome.get(p.id).detail, /engine refused/);
  overworld.refuseAdds = false;
  clean('busy');

  held.push(...Array.from({ length: 9 }, () => budget.tryAcquire('structure')));
  assert.ok(held.slice(-9).every(Boolean), 'a structure search holds every slot it may');
  t0 = H.tick;
  use(p);
  assert.equal(until(p, t0).outcome, 'arrived', 'the reserved slot carries the trip');
  for (const l of held) l.release();
  clean('busy, then reserve');
});

test('row 3 on the engine: an unknown dimension is refused with a message; the binding is kept', () => {
  const p = fakePlayer('nowhere');
  p.items[0] = boundRod(p, { id: 'andrew:nowhere' }, { x: 0, y: 64, z: 0 });
  const t0 = H.tick;
  use(p);
  assert.equal(until(p, t0).outcome, 'dimension-refused');
  keptAfter(p, 'dimension-refused', 'andrew.pearl_rod.dimension_refused');
  clean('dimension');
});

test('row 5 on the engine: a second use while travelling is cancelled with "already travelling"; the trip goes on', () => {
  const p = fakePlayer('twice');
  const np = { x: -3000, y: 70, z: 5 };
  pad(nether, np);
  p.items[0] = boundRod(p, nether, np);
  const t0 = H.tick;
  assert.equal(use(p), true);
  assert.equal(use(p), true, 'the same tick: no second trip');
  tick(3);
  assert.equal(use(p), true, 'while loading');
  tick(1);
  assert.equal(E.teleportStats.outcomes.travelling >= 2, true);
  const o = until(p, t0);
  assert.equal(o.outcome, 'arrived');
  assert.deepEqual(p.bars, ['andrew.pearl_rod.travelling', 'andrew.pearl_rod.travelling', 'andrew.pearl_rod.arrived']);
  assert.equal(nether.commands.filter((c) => c.startsWith('tickingarea add') && c.includes('-3001')).length, 1, 'one area for one trip');
  clean('travelling');
});

test('row 6 on the engine: death while the trip waits aborts it silently, by entityDie, a moved epoch, or health 0 alone', () => {
  // `health`: the death as the trip's interval sees it on BDS — health 0, its entityDie and epoch bump not delivered yet.
  for (const how of ['entityDie', 'epoch', 'health']) {
    const p = fakePlayer(`dies_${how}`);
    const np = { x: 6000 + how.length, y: 70, z: 0 };
    pad(nether, np);
    p.items[0] = boundRod(p, nether, np);
    const t0 = H.tick;
    use(p);
    tick(3);
    assert.equal(E.pendingTrips(), 1);
    if (how === 'entityDie') H.die({ deadEntity: p });
    else if (how === 'epoch') p.epoch++;
    else p.health = 0;
    const o = until(p, t0);
    assert.equal(o.outcome, 'died', how);
    assert.equal(p.teleports.length, 0, `${how}: not moved`);
    assert.deepEqual(p.bars, [], `${how}: no message`);
    clean(how);
    if (how !== 'epoch') p.epoch++;
    p.health = 20;
    assert.equal(use(p), false, `${how}: after the death the old binding casts (void by epoch)`);
  }
  const quick = fakePlayer('dies_before_start');
  quick.items[0] = boundRod(quick, overworld, { x: 1, y: 64, z: 1 });
  const t0 = H.tick;
  use(quick);
  H.die({ deadEntity: quick });
  assert.equal(until(quick, t0).outcome, 'died', 'died in the tick of the use, before the area');
  clean('died before start');
  H.die({ deadEntity: undefined });
  H.die({ deadEntity: { get id() { throw new Error('removed'); } } });
});

test('row 7 on the engine: a stranger and the owner after a death cast; the binding is left as it is', () => {
  const owner = fakePlayer('owner7', { epoch: 5 });
  const stranger = fakePlayer('stranger7', { epoch: 5 });
  const plate = { x: 1200, y: 64, z: 0 };
  pad(overworld, plate);
  const rod = boundRod(owner, overworld, plate);
  stranger.items[0] = rod.clone();
  assert.equal(use(stranger), false, 'the stranger casts');
  tick(3);
  assert.equal(stranger.teleports.length, 0);
  assert.deepEqual(E.bindingOf(stranger.items[0]), E.bindingOf(rod), 'unchanged');
  owner.items[0] = rod.clone();
  owner.epoch = 6;
  assert.equal(use(owner), false, 'the owner after a death casts');
  clean('stranger');
});

test('row 8 on the engine: a riding owner is ejected from the mount, then moved', () => {
  const p = fakePlayer('rider');
  const ejected = [];
  p.riding = { isValid: true, getComponent: (id) => (id === 'minecraft:rideable' ? { ejectRider: (r) => { ejected.push(r.name); p.riding = undefined; } } : undefined) };
  const plate = { x: 1400, y: 64, z: 0 };
  pad(overworld, plate);
  p.items[0] = boundRod(p, overworld, plate);
  const t0 = H.tick;
  use(p);
  assert.equal(until(p, t0).outcome, 'arrived');
  assert.deepEqual(ejected, ['rider']);
  assert.equal(p.teleports[0].riding, false, 'off the mount before the teleport');
  clean('rider');
});

test('a failed trip does not eject a rider: the mount is left only for a teleport that happens', () => {
  const p = fakePlayer('rider_unsafe');
  let ejects = 0;
  p.riding = { isValid: true, getComponent: () => ({ ejectRider: () => ejects++ }) };
  p.items[0] = boundRod(p, overworld, { x: 1500, y: 64, z: 0 });
  const t0 = H.tick;
  use(p);
  assert.equal(until(p, t0).outcome, 'plate-gone');
  assert.equal(ejects, 0);
  clean('rider, plate gone');
});

test('pr03 keep rows on the engine: the rod left the inventory mid-wait; the read-back mismatched; the player logged out', () => {
  const p = fakePlayer('dropper');
  const np = { x: 8000, y: 70, z: 0 };
  pad(nether, np);
  p.items[0] = boundRod(p, nether, np);
  let t0 = H.tick;
  use(p);
  tick(2);
  const rod = p.items[0];
  p.items[0] = undefined;
  assert.equal(until(p, t0).outcome, 'rod-left');
  assert.equal(p.teleports.length, 0);
  assert.deepEqual(p.bars, ['andrew.pearl_rod.rod_left']);
  assert.ok(E.bindingOf(rod) !== undefined, 'the binding stays on that rod');
  clean('rod left');

  p.items[5] = rod;
  t0 = H.tick;
  use(p, 5);
  tick(2);
  p.items[7] = p.items[5];
  p.items[5] = undefined;
  assert.equal(until(p, t0).outcome, 'arrived', 'a rod moved to another slot is still found by its id');
  assert.equal(E.bindingOf(p.items[7]), undefined, 'cleared where it is now');
  clean('rod moved');

  const s = fakePlayer('stuck');
  const plate = { x: 1700, y: 64, z: 0 };
  pad(overworld, plate);
  s.items[0] = boundRod(s, overworld, plate);
  s.stuck = true;
  t0 = H.tick;
  use(s);
  assert.equal(until(s, t0).outcome, 'failed');
  assert.equal(s.teleports.length, 1, 'the teleport was asked for');
  assert.ok(E.bindingOf(s.items[0]) !== undefined, 'kept');
  assert.deepEqual(s.bars, ['andrew.pearl_rod.failed']);
  clean('read-back');

  const gone = fakePlayer('logout');
  gone.items[0] = boundRod(gone, nether, { x: 9000, y: 70, z: 0 });
  t0 = H.tick;
  use(gone);
  tick(2);
  gone.isValid = false;
  assert.equal(until(gone, t0).outcome, 'offline');
  clean('offline');
});

test('the name trap: a name removed in this tick is not added again in the same tick', () => {
  const a = fakePlayer('trap_a');
  const b = fakePlayer('trap_b');
  const np = { x: 10_000, y: 70, z: 0 };
  pad(nether, np);
  a.items[0] = boundRod(a, nether, np);
  b.items[0] = boundRod(b, nether, np);
  const t0 = H.tick;
  use(a);
  tick(3);
  assert.deepEqual(E.heldAreaNames(), ['andrew_pearl_0']);
  // In one tick: A's trip ends (death) and B's starts.
  H.queue.push(() => H.die({ deadEntity: a }));
  use(b);
  tick();
  assert.deepEqual(E.heldAreaNames(), ['andrew_pearl_1']);
  assert.equal(until(b, t0).outcome, 'arrived');
  clean('name trap');
});

test('a throw inside a trip ends it as "failed" with the area removed', () => {
  const p = fakePlayer('thrower');
  const plate = { x: 1900, y: 64, z: 0 };
  pad(overworld, plate);
  p.items[0] = boundRod(p, overworld, plate);
  const t0 = H.tick;
  use(p);
  tick(1);
  p.teleport = () => { throw new Error('boom'); };
  assert.equal(until(p, t0).outcome, 'failed');
  assert.match(E.lastOutcome.get(p.id).detail, /boom/);
  assert.ok(E.bindingOf(p.items[0]) !== undefined);
  clean('throw');
});
