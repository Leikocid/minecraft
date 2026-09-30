// The LMB effect (L0-pntr-p001…p003, r004…r009, ent2, cons) against a fake
// engine: every block read and write, the sound, the particles, the jobs and
// the calls to lgnd's protectLegendariesIn — which the test replaces, so a
// protection that throws can be staged (PN-5).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const engineStub = `
export const LocationInUnloadedChunkError = globalThis.__pntr.Unloaded;
export const UnloadedChunksError = globalThis.__pntr.UnloadedChunks;
export const system = globalThis.__pntr.system;
export const world = globalThis.__pntr.world;
export const BlockTypes = globalThis.__pntr.BlockTypes;
export const BlockPermutation = globalThis.__pntr.BlockPermutation;
export const LiquidType = { Water: 'Water' };
export class BlockVolume {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}
`;
const recoveryStub = `
export const HOLDER_TYPES = ["minecraft:chest", "minecraft:barrel", "minecraft:furnace", "minecraft:frame", "minecraft:glow_frame", "minecraft:crafter"];
export function protectLegendariesIn(dim, volume, opts) { return globalThis.__pntr.protect(dim, volume, opts); }
export function isLegendaryItemEntity(entity) { return entity.legendary === true; }
`;

class Unloaded extends Error {}
class UnloadedChunks extends Error {}

/** Types this fake engine knows, and which of them can hold water (canContainLiquid). */
const KNOWN = [
  'minecraft:air', 'minecraft:stone', 'minecraft:netherrack', 'minecraft:bedrock', 'minecraft:water', 'minecraft:flowing_water', 'minecraft:lava', 'minecraft:flowing_lava',
  'minecraft:end_portal_frame', 'minecraft:barrier', 'minecraft:obsidian', 'minecraft:crying_obsidian', 'minecraft:portal', 'minecraft:mob_spawner',
  'minecraft:reinforced_deepslate', 'minecraft:ancient_debris', 'minecraft:oak_fence', 'minecraft:oak_stairs', 'minecraft:chest', 'minecraft:barrel',
  'minecraft:furnace', 'minecraft:frame', 'minecraft:glow_frame', 'minecraft:crafter',
];
const WATERLOGGABLE = new Set(['minecraft:oak_fence', 'minecraft:oak_stairs', 'minecraft:chest', 'minecraft:barrier']);

const fake = {
  Unloaded,
  UnloadedChunks,
  world: { afterEvents: { worldLoad: { subscribe: () => {} } } },
  BlockTypes: {
    getAll: () => KNOWN.map((id) => ({ id })),
    get: (id) => (KNOWN.includes(id) ? { id } : undefined),
  },
  BlockPermutation: {
    resolve: (id) => ({ canContainLiquid: () => WATERLOGGABLE.has(id) }),
  },
  system: {
    currentTick: 1000,
    nextId: 1,
    jobs: new Map(),
    intervals: new Map(),
    runJob(gen) {
      const id = this.nextId++;
      this.jobs.set(id, gen);
      return id;
    },
    runInterval(cb) {
      const id = this.nextId++;
      this.intervals.set(id, cb);
      return id;
    },
    clearRun(id) {
      this.intervals.delete(id);
    },
  },
  protect: () => ({ moved: 0, handedBack: 0 }),
};
globalThis.__pntr = fake;

const plugin = {
  name: 'pntr-stubs',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'server', namespace: 'stub' }));
    b.onResolve({ filter: /legendary\/recovery$/ }, () => ({ path: 'recovery', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({ contents: args.path === 'server' ? engineStub : recoveryStub, loader: 'js' }));
  },
};

const bundle = await build({
  stdin: {
    contents: "export * from './src/orbital/penetrator.ts'; export * from './src/orbital/penetrator-plan.ts'; export { effectFor } from './src/orbital/charge.ts';",
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [plugin],
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  PENETRATOR_EFFECT,
  registerPenetrator,
  effectFor,
  observePenetratorReports,
  penetratorJobs,
  planColumn,
  specialTypes,
  isPlannedCell,
  layerOffsets,
  waveLayers,
  waveCalls,
  avoidBox,
  footprintOf,
  EXPLOSION_SOUND,
  WAVE_TICKS,
  WAVE_CAP,
  FIRST_TICK_LAYERS,
} = mod;

// ------------------------------------------------------------------ fake world

const HEIGHT = { overworld: { min: -64, max: 320 }, nether: { min: 0, max: 128 } };
const LIQUIDS = new Set(['minecraft:water', 'minecraft:flowing_water', 'minecraft:lava', 'minecraft:flowing_lava']);
const key = (x, y, z) => `${x},${y},${z}`;

/**
 * A dimension of stone below `surface` and air above, with overrides. It
 * records every engine call in `events`, in order, and the tick it came in.
 */
function world({ id = 'minecraft:overworld', surface = 80, range = HEIGHT.overworld, unloaded = () => false, throwsUnloaded = () => false, breaks = () => false, fillFails = () => false } = {}) {
  const cells = new Map();
  const events = [];
  const at = (x, y, z) => {
    const k = key(x, y, z);
    if (!cells.has(k)) cells.set(k, { typeId: y <= surface ? 'minecraft:stone' : 'minecraft:air', waterlogged: false });
    return cells.get(k);
  };
  const dim = {
    id,
    heightRange: range,
    events,
    cells,
    at,
    items: [],
    set(x, y, z, typeId, extra = {}) {
      cells.set(key(x, y, z), { typeId, waterlogged: false, ...extra });
    },
    getBlock({ x, y, z }) {
      if (throwsUnloaded(x, y, z)) throw new Unloaded(`${key(x, y, z)} is in an unloaded chunk`);
      if (unloaded(x, y, z)) return undefined;
      if (breaks(x, y, z)) throw new Error(`engine refused ${key(x, y, z)}`);
      const cell = at(x, y, z);
      return {
        get typeId() {
          return cell.typeId;
        },
        get isAir() {
          return cell.typeId === 'minecraft:air';
        },
        get isLiquid() {
          return LIQUIDS.has(cell.typeId);
        },
        get isWaterlogged() {
          return cell.waterlogged;
        },
        getComponent(name) {
          if (name !== 'minecraft:inventory' || cell.items === undefined) return undefined;
          return {
            container: {
              size: cell.size ?? 27,
              clearAll() {
                events.push({ kind: 'clearAll', at: key(x, y, z), tick: fake.system.currentTick });
                cell.items = [];
              },
            },
          };
        },
        setType(typeId) {
          events.push({ kind: 'setType', at: key(x, y, z), to: typeId, tick: fake.system.currentTick });
          cell.typeId = typeId;
          cell.waterlogged = false;
          if (typeId === 'minecraft:air' || LIQUIDS.has(typeId)) cell.items = undefined;
        },
      };
    },
    playSound(soundId, location, options) {
      events.push({ kind: 'sound', soundId, location, options, tick: fake.system.currentTick });
    },
    spawnParticle(effect, location) {
      events.push({ kind: 'particle', effect, location, tick: fake.system.currentTick });
    },
    getEntities({ location }) {
      return dim.items.filter((e) => e.cell === key(location.x, location.y, location.z) && e.valid);
    },
    isChunkLoaded({ x, y, z }) {
      return !unloaded(x, y, z);
    },
    getBlocks(volume, { includeTypes }) {
      const found = [];
      for (let x = volume.from.x; x <= volume.to.x; x++)
        for (let y = volume.from.y; y <= volume.to.y; y++)
          for (let z = volume.from.z; z <= volume.to.z; z++) if (!unloaded(x, y, z) && includeTypes.includes(at(x, y, z).typeId)) found.push({ x, y, z });
      return { getBlockLocationIterator: () => found[Symbol.iterator]() };
    },
    fillBlocks(volume, typeId, { blockFilter, ignoreChunkBoundErrors }) {
      if (fillFails(volume.from)) {
        const cells = (volume.to.x - volume.from.x + 1) * (volume.to.y - volume.from.y + 1) * (volume.to.z - volume.from.z + 1);
        events.push({ kind: 'fillRefused', cells });
        throw new UnloadedChunks(`fill at ${key(volume.from.x, volume.from.y, volume.from.z)}`);
      }
      events.push({ kind: 'fillCall', from: volume.from, to: volume.to, exclude: blockFilter.excludeTypes, tick: fake.system.currentTick });
      let n = 0;
      for (let x = volume.from.x; x <= volume.to.x; x++)
        for (let y = volume.from.y; y <= volume.to.y; y++)
          for (let z = volume.from.z; z <= volume.to.z; z++) {
            if (unloaded(x, y, z)) {
              if (!ignoreChunkBoundErrors) throw new UnloadedChunks('fill over an unloaded chunk');
              continue;
            }
            const cell = at(x, y, z);
            if (blockFilter.excludeTypes.includes(cell.typeId)) continue;
            events.push({ kind: 'fill', at: key(x, y, z), was: cell.typeId, waterlogged: cell.waterlogged, to: typeId, tick: fake.system.currentTick });
            cell.typeId = typeId;
            cell.waterlogged = false;
            cell.items = undefined;
            n++;
          }
      return { getCapacity: () => n };
    },
  };
  return dim;
}

/** Every block write, cell by cell or by fill. */
const writes = (dim) => dim.events.filter((e) => e.kind === 'setType' || e.kind === 'fill');

let tickHook = () => {};

/** One engine tick: the tick counter moves and the intervals fire. A 'slice' marks each tick boundary. */
function tick() {
  fake.system.currentTick++;
  tickHook();
  for (const d of dims) d.events.push({ kind: 'slice', tick: fake.system.currentTick });
  for (const cb of [...fake.system.intervals.values()]) cb();
}

const dims = [];
function newWorld(opts) {
  const d = world(opts);
  dims.push(d);
  return d;
}

/** Detonates, lets the detonation tick's microtask run, then ticks until every job is gone. */
async function fire(dim, point, attackId, { maxTicks = 60 } = {}) {
  const reports = [];
  const stop = observePenetratorReports((r) => reports.push(r));
  PENETRATOR_EFFECT.onDetonate(dim, point, 'owner-1', 'lmb', attackId);
  await Promise.resolve();
  await Promise.resolve();
  const detonationTick = fake.system.currentTick;
  for (let t = 0; t < maxTicks && penetratorJobs().size > 0; t++) tick();
  stop();
  return { reports, detonationTick };
}

function captureWarn() {
  const original = console.warn;
  const lines = [];
  console.warn = (...args) => lines.push(args.map(String).join(' '));
  return { lines, stop: () => void (console.warn = original) };
}

function resetFake() {
  fake.protect = () => ({ moved: 0, handedBack: 0 });
  fake.system.jobs.clear();
  fake.system.intervals.clear();
  dims.length = 0;
  tickHook = () => {};
}

// ------------------------------------------------------------------ registration

test('registerPenetrator replaces the LMB stub with the real effect; the layout is the target column', () => {
  registerPenetrator();
  assert.equal(effectFor('lmb'), PENETRATOR_EFFECT);
  assert.deepEqual(PENETRATOR_EFFECT.layout({ x: 5, y: 60, z: -7 }), [{ x: 5, z: -7 }]);
  assert.equal(PENETRATOR_EFFECT.scale, 1);
});

// ------------------------------------------------------------------ removal

test('a stone column is removed to heightRange.min; nothing outside the plan is written', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  const { reports } = await fire(dim, { x: 10, y: 80, z: 20 }, 'oc-1-stone');
  const plan = planColumn('oc-1-stone', { x: 10, y: 80, z: 20 }, HEIGHT.overworld);
  const written = writes(dim);
  for (const w of written) {
    const [x, y, z] = w.at.split(',').map(Number);
    assert.ok(isPlannedCell(plan, x, y, z), `wrote ${w.at} outside the plan`);
    assert.equal(w.to, 'minecraft:air');
  }
  let planned = 0;
  for (let y = plan.top; y >= plan.bottom; y--) planned += layerOffsets(plan, y).length;
  assert.equal(written.length, planned, 'every planned stone cell is written once');
  assert.equal(new Set(written.map((w) => w.at)).size, written.length, 'no cell is written twice');
  assert.equal(reports.length, 1);
  const r = reports[0];
  assert.equal(r.attackId, 'oc-1-stone');
  assert.equal(r.scanned, planned);
  assert.equal(r.removed, planned);
  assert.equal(r.kept + r.keptProtectFailed + r.skippedUnloaded + r.errors, 0);
  assert.equal(r.top, 80);
  assert.equal(r.bottom, -64);
  assert.ok(r.ticksUsed >= 1 && r.ticksUsed === r.endedTick - r.startedTick + 1);
  assert.equal(penetratorJobs().size, 0, 'both jobs end on their own');
});

test('kept cells stay and never stop the column: bedrock, keep list, liquids; the cell under them goes', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  dim.set(0, 20, 0, 'minecraft:bedrock');
  dim.set(0, 30, 0, 'minecraft:end_portal_frame');
  dim.set(0, 40, 0, 'minecraft:water');
  dim.set(1, 40, 0, 'minecraft:lava');
  dim.set(0, 50, 0, 'minecraft:barrier');
  const { reports } = await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-2-keep');
  for (const [y, id, x] of [[20, 'minecraft:bedrock', 0], [30, 'minecraft:end_portal_frame', 0], [40, 'minecraft:water', 0], [40, 'minecraft:lava', 1], [50, 'minecraft:barrier', 0]]) {
    assert.equal(dim.at(x, y, 0).typeId, id, `${id} at y=${y}`);
    assert.equal(dim.at(0, y - 1, 0).typeId, 'minecraft:air', `the stone under ${id} (y=${y - 1}) is gone`);
  }
  assert.equal(dim.at(0, -64, 0).typeId, 'minecraft:air', 'the column reaches heightRange.min');
  assert.equal(reports[0].kept, 5);
});

test('obsidian, reinforced deepslate, spawners and portal blocks are removed like stone (L0-pntr-r003)', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  const ids = ['minecraft:obsidian', 'minecraft:crying_obsidian', 'minecraft:portal', 'minecraft:mob_spawner', 'minecraft:reinforced_deepslate', 'minecraft:ancient_debris'];
  ids.forEach((id, i) => dim.set(0, 70 - i, 0, id));
  await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-3-hard');
  ids.forEach((id, i) => assert.equal(dim.at(0, 70 - i, 0).typeId, 'minecraft:air', id));
});

test('a waterlogged block becomes a water source; its solid part goes (L0-pntr-as04)', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  dim.set(0, 60, 0, 'minecraft:oak_fence', { waterlogged: true });
  await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-4-wet');
  assert.equal(dim.at(0, 60, 0).typeId, 'minecraft:water');
});

test('a holder: protect(cell) → clearAll → setType in one step, no slice between; counters move', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  dim.set(0, 50, 0, 'minecraft:chest', { items: ['cobblestone x64'] });
  dim.set(1, 49, 0, 'minecraft:barrel', { items: ['dirt'], waterlogged: true });
  const calls = [];
  fake.protect = (d, volume, opts) => {
    d.events.push({ kind: 'protect', at: key(volume.min.x, volume.min.y, volume.min.z), tick: fake.system.currentTick });
    calls.push({ volume, opts });
    return volume.min.y === 50 ? { moved: 1, handedBack: 0 } : { moved: 0, handedBack: 1 };
  };
  const { reports } = await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-5-holder');
  for (const [cell, to] of [['0,50,0', 'minecraft:air'], ['1,49,0', 'minecraft:water']]) {
    const seq = dim.events.filter((e) => e.at === cell || e.kind === 'slice');
    const i = seq.findIndex((e) => e.kind === 'protect');
    assert.deepEqual(seq.slice(i, i + 3).map((e) => e.kind), ['protect', 'clearAll', 'setType'], `${cell}: ${JSON.stringify(seq.slice(i, i + 3))}`);
    assert.equal(seq[i + 2].to, to);
  }
  assert.deepEqual(calls[0].volume, { min: { x: 0, y: 50, z: 0 }, max: { x: 0, y: 50, z: 0 } }, 'the call names exactly the holder cell');
  assert.match(calls[0].opts.reason, /pntr oc-5-holder/);
  const plan = planColumn('oc-5-holder', { x: 0, y: 80, z: 0 }, HEIGHT.overworld);
  assert.deepEqual(calls[0].opts.avoid, footprintOf(plan), 'the drop avoids the whole column');
  const r = reports[0];
  assert.equal(r.containersCleared, 2);
  assert.equal(r.legendariesProtected, 2);
  assert.equal(r.keptProtectFailed, 0);
});

// AC#5 — PN-5 / L0-pntr-ac04: safety beats looks.
test('PN-5: protect throws → the holder stays with its contents, the error is logged, the column goes on below', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  dim.set(0, 50, 0, 'minecraft:chest', { items: ['andrew:web_sword', 'cobblestone x64'] });
  dim.set(0, 30, 0, 'minecraft:chest', { items: ['dirt'] });
  fake.protect = (d, volume) => {
    if (volume.min.y === 50) throw new Error('legendary protect: stub refusal');
    return { moved: 0, handedBack: 0 };
  };
  const warn = captureWarn();
  let reports;
  try {
    ({ reports } = await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-6-refused'));
  } finally {
    warn.stop();
  }
  const chest = dim.at(0, 50, 0);
  assert.equal(chest.typeId, 'minecraft:chest', 'the chest is still there');
  assert.deepEqual(chest.items, ['andrew:web_sword', 'cobblestone x64'], 'and still holds the sword and the rest');
  assert.equal(dim.events.filter((e) => e.at === '0,50,0' && (e.kind === 'clearAll' || e.kind === 'setType')).length, 0, 'never cleared, never replaced');
  assert.ok(warn.lines.some((l) => l.includes('0,50,0') && l.includes('stub refusal') && l.includes('kept')), `no log line: ${warn.lines.join(' | ')}`);
  assert.equal(dim.at(0, 49, 0).typeId, 'minecraft:air', 'the cell right below is removed');
  assert.equal(dim.at(0, 30, 0).typeId, 'minecraft:air', 'a later holder is still protected and removed');
  assert.equal(dim.at(0, -64, 0).typeId, 'minecraft:air', 'the column reaches the bottom');
  assert.equal(reports[0].keptProtectFailed, 1);
  assert.equal(reports[0].containersCleared, 1);
});

test('a holder the engine gives no inventory (crafter) still goes through protect; its refusal keeps it', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  dim.set(0, 50, 0, 'minecraft:crafter');
  const seen = [];
  fake.protect = (d, volume) => {
    seen.push(volume.min.y);
    throw new Error('legendary protect: minecraft:crafter at 0,50,0 has no script-readable inventory');
  };
  const warn = captureWarn();
  try {
    const { reports } = await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-7-crafter');
    assert.equal(reports[0].keptProtectFailed, 1);
  } finally {
    warn.stop();
  }
  assert.deepEqual(seen, [50]);
  assert.equal(dim.at(0, 50, 0).typeId, 'minecraft:crafter');
});

test('a double chest: halves both in the plan are cleared and removed; a half paired beyond the plan stays untouched', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  const plan = planColumn('oc-8-double', { x: 0, y: 80, z: 0 }, HEIGHT.overworld);
  let edge;
  for (let y = 70; y > 0 && edge === undefined; y--) if (isPlannedCell(plan, 2, y, 0) && !isPlannedCell(plan, 3, y, 0)) edge = y;
  assert.ok(edge !== undefined, 'the plan has a layer where x=2 is planned and x=3 is not');
  dim.set(0, 76, 0, 'minecraft:chest', { items: ['in-a'], size: 54 });
  dim.set(1, 76, 0, 'minecraft:chest', { items: ['in-b'], size: 54 });
  dim.set(2, edge, 0, 'minecraft:chest', { items: ['inner'], size: 54 });
  dim.set(3, edge, 0, 'minecraft:chest', { items: ['outer'], size: 54 });
  const protectedCells = [];
  fake.protect = (d, volume) => {
    protectedCells.push(key(volume.min.x, volume.min.y, volume.min.z));
    return { moved: 0, handedBack: 0 };
  };
  const warn = captureWarn();
  let reports;
  try {
    ({ reports } = await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-8-double'));
  } finally {
    warn.stop();
  }
  assert.equal(dim.at(0, 76, 0).typeId, 'minecraft:air');
  assert.equal(dim.at(1, 76, 0).typeId, 'minecraft:air');
  assert.equal(dim.at(2, edge, 0).typeId, 'minecraft:chest', 'the half paired beyond the plan stays');
  assert.deepEqual(dim.at(2, edge, 0).items, ['inner']);
  assert.deepEqual(dim.at(3, edge, 0).items, ['outer']);
  assert.ok(!protectedCells.includes(`2,${edge},0`), 'a kept half is not emptied of its legendaries either');
  assert.equal(dim.events.filter((e) => e.kind === 'clearAll').length, 2);
  assert.ok(warn.lines.some((l) => l.includes(`2,${edge},0`) && l.includes('double chest')));
  assert.equal(reports[0].containersCleared, 2);
});

test('a frame: protect breaks it open, then what it spilled goes with the column except a legendary', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  dim.set(0, 50, 0, 'minecraft:frame');
  const old = { id: 'old', cell: '0,50,0', valid: true, remove() { this.valid = false; } };
  dim.items.push(old);
  fake.protect = (d, volume) => {
    if (volume.min.y !== 50) return { moved: 0, handedBack: 0 };
    d.set(0, 50, 0, 'minecraft:air');
    for (const [id, legendary] of [['frame-item', false], ['map', false], ['sword', true]]) {
      d.items.push({ id, legendary, cell: '0,50,0', valid: true, remove() { this.valid = false; } });
    }
    return { moved: 0, handedBack: 0 };
  };
  await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-9-frame');
  const valid = dim.items.filter((e) => e.valid).map((e) => e.id).sort();
  assert.deepEqual(valid, ['old', 'sword'], 'items lying there before and a legendary are not touched');
});

test('unloaded chunks are skipped and counted, never retried; engine errors are counted, never thrown, and never written over', async () => {
  resetFake();
  // Column centre x=14: dx ≥ 2 lies in the next chunk (x ≥ 16), which is not loaded.
  const dim = newWorld({
    surface: 80,
    unloaded: (x) => x >= 16,
    throwsUnloaded: (x, y) => x === 14 && y === 60,
    breaks: (x, y) => x === 14 && y === 40,
    fillFails: (from) => from.y === -64 && from.x < 16,
  });
  dim.set(14, 60, 0, 'minecraft:chest', { items: ['a'] });
  dim.set(14, 40, 0, 'minecraft:chest', { items: ['b'] });
  const warn = captureWarn();
  let reports;
  try {
    ({ reports } = await fire(dim, { x: 14, y: 80, z: 0 }, 'oc-10-edge'));
  } finally {
    warn.stop();
  }
  const plan = planColumn('oc-10-edge', { x: 14, y: 80, z: 0 }, HEIGHT.overworld);
  let east = 0;
  for (let y = plan.top; y >= plan.bottom; y--) east += layerOffsets(plan, y).filter((o) => o.dx >= 2).length;
  const refused = dim.events.filter((e) => e.kind === 'fillRefused').reduce((n, e) => n + e.cells, 0);
  const r = reports[0];
  assert.ok(east > 0 && refused > 0);
  assert.equal(r.skippedUnloaded, east + 1 + refused, 'the unloaded chunk, the chest whose chunk went, and the pieces whose fill refused');
  assert.equal(r.errors, 1);
  assert.equal(writes(dim).filter((e) => Number(e.at.split(',')[0]) >= 16).length, 0, 'nothing written in the unloaded chunk');
  assert.equal(dim.at(14, 40, 0).typeId, 'minecraft:chest', 'the cell whose read threw is not filled over');
  assert.deepEqual(dim.at(14, 40, 0).items, ['b']);
  assert.equal(dim.at(14, 39, 0).typeId, 'minecraft:air', 'the column goes on past the failed cell');
  assert.ok(warn.lines.some((l) => l.includes('14,40,0')));
});

test('overlapping columns: the second finds air where the first went and writes nothing twice (L0-pntr-r007)', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-11-a');
  const first = writes(dim).length;
  const { reports } = await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-11-b');
  const b = planColumn('oc-11-b', { x: 0, y: 80, z: 0 }, HEIGHT.overworld);
  const a = planColumn('oc-11-a', { x: 0, y: 80, z: 0 }, HEIGHT.overworld);
  let fresh = 0;
  for (let y = b.top; y >= b.bottom; y--) fresh += layerOffsets(b, y).filter((o) => !isPlannedCell(a, o.dx, y, o.dz)).length;
  assert.equal(writes(dim).length - first, fresh);
  assert.equal(reports[0].air, reports[0].scanned - fresh);
});

test('avoid: own footprint plus live columns nearby in the same dimension, not far ones or other dimensions', () => {
  const own = { min: { x: 0, y: -64, z: 0 }, max: { x: 6, y: 80, z: 6 } };
  const near = { dimensionId: 'o', footprint: { min: { x: 4, y: -64, z: 3 }, max: { x: 10, y: 90, z: 9 } } };
  const far = { dimensionId: 'o', footprint: { min: { x: 100, y: -64, z: 0 }, max: { x: 106, y: 80, z: 6 } } };
  const other = { dimensionId: 'n', footprint: { min: { x: 2, y: 0, z: 2 }, max: { x: 8, y: 100, z: 8 } } };
  assert.deepEqual(avoidBox(own, 'o', [near, far, other, { dimensionId: 'o', footprint: own }]), {
    min: { x: 0, y: -64, z: 0 },
    max: { x: 10, y: 90, z: 9 },
  });
});

test('two columns detonating in one tick protect with one avoid box that covers both (L0-pntr-ac04)', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  dim.set(0, 78, 0, 'minecraft:chest', { items: ['andrew:web_sword'] });
  const avoids = [];
  fake.protect = (d, volume, opts) => {
    avoids.push(opts.avoid);
    return { moved: 1, handedBack: 0 };
  };
  PENETRATOR_EFFECT.onDetonate(dim, { x: 0, y: 80, z: 0 }, 'a', 'lmb', 'oc-12-a');
  PENETRATOR_EFFECT.onDetonate(dim, { x: 4, y: 80, z: 2 }, 'b', 'lmb', 'oc-12-b');
  await Promise.resolve();
  for (let t = 0; t < 60 && penetratorJobs().size > 0; t++) tick();
  assert.equal(avoids.length, 1);
  assert.deepEqual(avoids[0], { min: { x: -3, y: -64, z: -3 }, max: { x: 7, y: 80, z: 5 } });
});

// ------------------------------------------------------------------ timing (PN-1)

test('the detonation tick: the sound first, then at least the top 16 layers, before any job slice', async () => {
  resetFake();
  const dim = newWorld({ surface: 319 });
  const { reports, detonationTick } = await fire(dim, { x: 0, y: 319, z: 0 }, 'oc-13-tall', { maxTicks: 200 });
  const firstSlice = dim.events.findIndex((e) => e.kind === 'slice');
  const before = dim.events.slice(0, firstSlice);
  assert.equal(before[0].kind, 'sound', 'the sound comes before any block write');
  const early = before.filter((e) => e.kind === 'setType' || e.kind === 'fill');
  const ys = early.map((e) => Number(e.at.split(',')[1]));
  assert.ok(ys.every((y) => y > 319 - FIRST_TICK_LAYERS * 2), 'the prefix works from the top');
  assert.ok(Math.min(...ys) <= 319 - FIRST_TICK_LAYERS + 1, `the prefix stopped at y=${Math.min(...ys)}`);
  assert.ok(early.every((e) => e.tick === detonationTick));
  assert.equal(reports[0].firstTickLayers, FIRST_TICK_LAYERS);
  assert.equal(reports[0].budgetTicks, 6);
  assert.equal(reports[0].msByTick.length, reports[0].ticksUsed);
});

test('a column shorter than 16 layers goes entirely in the detonation tick and starts no stepper', async () => {
  resetFake();
  const dim = newWorld({ id: 'minecraft:nether', surface: 10, range: HEIGHT.nether });
  PENETRATOR_EFFECT.onDetonate(dim, { x: 0, y: 10, z: 0 }, 'owner-1', 'lmb', 'oc-14-short');
  await Promise.resolve();
  assert.equal(fake.system.intervals.size, 1, 'only the wave runs on');
  const { reports } = await fire(dim, { x: 0, y: 10, z: 0 }, 'oc-14-short-2');
  assert.equal(reports[0].ticksUsed, 1);
  assert.equal(reports[0].firstTickLayers, 11);
  assert.equal(reports[0].budgetTicks, 3);
  for (let t = 0; t < 30; t++) tick();
});

test('one shared stepper while columns are left, gone when the last one ends; no runJob', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  let jobs = 0;
  fake.system.runJob = () => {
    jobs++;
    return 0;
  };
  PENETRATOR_EFFECT.onDetonate(dim, { x: 0, y: 80, z: 0 }, 'a', 'lmb', 'oc-19-a');
  PENETRATOR_EFFECT.onDetonate(dim, { x: 20, y: 80, z: 0 }, 'b', 'lmb', 'oc-19-b');
  await Promise.resolve();
  assert.equal(fake.system.intervals.size, 3, 'two waves and one stepper');
  for (let t = 0; t < 60 && penetratorJobs().size > 0; t++) tick();
  assert.equal(fake.system.intervals.size, 0);
  assert.equal(jobs, 0);
});

// ------------------------------------------------------------------ sound and wave (L0-pntr-p003, r009; AC-10)

test('exactly one sound: random.explode at the detonation cell, loud and low', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  const { detonationTick } = await fire(dim, { x: 3, y: 80, z: -4 }, 'oc-15-sound');
  const sounds = dim.events.filter((e) => e.kind === 'sound');
  assert.equal(sounds.length, 1);
  assert.equal(sounds[0].soundId, EXPLOSION_SOUND);
  assert.equal(sounds[0].soundId, 'random.explode');
  assert.deepEqual(sounds[0].location, { x: 3.5, y: 80.5, z: -3.5 });
  assert.equal(sounds[0].tick, detonationTick);
  assert.ok(sounds[0].options.volume > 1 && sounds[0].options.pitch >= 0.6 && sounds[0].options.pitch <= 0.8);
});

for (const [label, top, range] of [
  ['140 layers', 75, HEIGHT.overworld],
  ['384 layers', 319, HEIGHT.overworld],
  ['7 layers', 6, HEIGHT.nether],
  ['1 layer', -64, HEIGHT.overworld],
]) {
  test(`the wave, ${label}: 20 consecutive ticks from the detonation tick, ≤ 16 calls each, y never rises, the last tick reaches the bottom`, async () => {
    resetFake();
    const dim = newWorld({ surface: top, range, id: range === HEIGHT.nether ? 'minecraft:nether' : 'minecraft:overworld' });
    const { detonationTick } = await fire(dim, { x: 0, y: top, z: 0 }, `oc-16-${label}`, { maxTicks: 200 });
    const byTick = new Map();
    for (const e of dim.events.filter((e) => e.kind === 'particle')) byTick.set(e.tick, [...(byTick.get(e.tick) ?? []), e]);
    const ticks = [...byTick.keys()].sort((a, b) => a - b);
    assert.deepEqual(ticks, Array.from({ length: WAVE_TICKS }, (_, i) => detonationTick + i));
    for (const t of ticks) assert.ok(byTick.get(t).length <= WAVE_CAP, `${byTick.get(t).length} calls in tick ${t}`);
    for (let i = 1; i < ticks.length; i++) {
      const prevMin = Math.min(...byTick.get(ticks[i - 1]).map((e) => e.location.y));
      const curMax = Math.max(...byTick.get(ticks[i]).map((e) => e.location.y));
      assert.ok(curMax <= prevMin, `tick ${i} rises: ${curMax} > ${prevMin}`);
    }
    const bottom = range.min;
    assert.ok(byTick.get(ticks[ticks.length - 1]).some((e) => Math.floor(e.location.y) === bottom), 'the last tick includes the bottom layer');
    assert.equal(fake.system.intervals.size, 0, 'the wave interval is cleared');
    assert.equal(penetratorJobs().size, 0);
  });
}

test('waveLayers: 20 steps tile [bottom, top] top-down, with no gap and no overlap, for any height', () => {
  for (const h of [1, 2, 7, 19, 20, 21, 128, 140, 256, 384]) {
    const top = 100;
    const bottom = top - h + 1;
    const seen = [];
    for (let t = 0; t < WAVE_TICKS; t++) {
      const ys = waveLayers(top, bottom, t);
      assert.ok(ys.length >= 1, `h=${h} t=${t} empty`);
      for (const y of ys) if (!seen.includes(y)) seen.push(y);
    }
    assert.deepEqual(seen, Array.from({ length: h }, (_, i) => top - i), `h=${h}`);
    assert.ok(waveLayers(top, bottom, WAVE_TICKS - 1).includes(bottom));
  }
});

test('waveCalls: an emitter every 4th layer at the centre, rim bursts on planned rim cells, sampled to 16', () => {
  const plan = planColumn('oc-17', { x: 0, y: 319, z: 0 }, HEIGHT.overworld);
  const calls = waveCalls(plan, 0, () => 0.5);
  assert.equal(calls.length, WAVE_CAP);
  for (const c of calls) {
    const x = Math.floor(c.at.x);
    const y = Math.floor(c.at.y);
    const z = Math.floor(c.at.z);
    if (c.effect === 'minecraft:huge_explosion_emitter') {
      assert.equal((plan.top - y) % 4, 0);
      assert.deepEqual([x, z], [0, 0]);
    } else {
      assert.equal(c.effect, 'minecraft:large_explosion');
      assert.ok(isPlannedCell(plan, x, y, z), `rim burst at ${x},${y},${z} is not in the plan`);
      const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !isPlannedCell(plan, x + dx, y, z + dz));
      assert.ok(open, `rim burst at ${x},${y},${z} has all four neighbours in the plan`);
    }
  }
});

// ------------------------------------------------------------------ what pntr never does (r004, r006, r008, PN-3)

test('static: penetrator.ts calls no explosion, drop, damage, movement, command, ticking area or dynamic property API', () => {
  const src = readFileSync(join(projectRoot, 'src', 'orbital', 'penetrator.ts'), 'utf-8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('/*'))
    .join('\n');
  for (const banned of [
    'createExplosion',
    'applyDamage',
    'applyKnockback',
    'applyImpulse',
    '.teleport(',
    '.kill(',
    'runCommand',
    'setDynamicProperty',
    'tickingarea',
    'tickingAreaManager',
    'doTileDrops',
    'spawnEntity',
    'spawnItem',
  ]) {
    assert.equal(src.includes(banned), false, `penetrator.ts uses ${banned}`);
  }
  const fills = src.match(/fillBlocks\([^;]*/g) ?? [];
  assert.equal(fills.length, 1, 'one fill call site');
  assert.match(fills[0], /fillBlocks\(piece\.volume, AIR, \{ blockFilter: \{ excludeTypes \}/, 'the fill writes only air, through the exclude filter');
});

test('the band fill never writes a holder, a water-holding type, a keep-list block or a liquid', async () => {
  resetFake();
  const dim = newWorld({ surface: 80 });
  const specials = [
    [0, 70, 0, 'minecraft:oak_fence', { waterlogged: true }],
    [1, 70, 0, 'minecraft:oak_fence', {}],
    [-1, 69, 0, 'minecraft:oak_stairs', {}],
    [0, 66, 0, 'minecraft:chest', { items: ['x'] }],
    [0, 65, 1, 'minecraft:barrel', { items: ['y'] }],
    [0, 60, 0, 'minecraft:barrier', {}],
    [1, 60, 0, 'minecraft:bedrock', {}],
    [0, 55, 0, 'minecraft:lava', {}],
    [0, 50, 0, 'minecraft:chest', { items: ['kept'] }],
  ];
  for (const [x, y, z, id, extra] of specials) dim.set(x, y, z, id, extra);
  fake.protect = (d, volume) => {
    if (volume.min.y === 50) throw new Error('refused');
    return { moved: 0, handedBack: 0 };
  };
  const warn = captureWarn();
  try {
    await fire(dim, { x: 0, y: 80, z: 0 }, 'oc-18-fill');
  } finally {
    warn.stop();
  }
  const risky = new Set([...specialTypes(), 'minecraft:bedrock', 'minecraft:barrier', 'minecraft:lava', 'minecraft:water']);
  const bad = dim.events.filter((e) => e.kind === 'fill' && risky.has(e.was));
  assert.deepEqual(bad, [], 'fill wrote over a cell it must not');
  assert.equal(dim.at(0, 70, 0).typeId, 'minecraft:water', 'the waterlogged fence kept its water');
  assert.equal(dim.at(1, 70, 0).typeId, 'minecraft:air', 'a dry fence goes cell by cell');
  assert.equal(dim.at(0, 50, 0).typeId, 'minecraft:chest', 'the refused chest stays, the fill excludes it');
  assert.deepEqual(dim.at(0, 50, 0).items, ['kept']);
  assert.equal(dim.at(0, 60, 0).typeId, 'minecraft:barrier');
  assert.equal(dim.at(0, 55, 0).typeId, 'minecraft:lava');
});

test('specialTypes: every holder lgnd lists and every type that can hold water, never a keep-list block', () => {
  const ids = specialTypes();
  for (const id of ['minecraft:oak_fence', 'minecraft:oak_stairs', 'minecraft:chest', 'minecraft:barrel', 'minecraft:frame', 'minecraft:crafter']) assert.ok(ids.includes(id), id);
  for (const id of ['minecraft:barrier', 'minecraft:stone', 'minecraft:water', 'minecraft:bedrock']) assert.ok(!ids.includes(id), id);
});

// AC#10 — PN-6: the deviations are written next to the code, each with its node id.
test('static: src/orbital/README.md lists the PN-6 deviations with their KV ids', () => {
  const readme = readFileSync(join(projectRoot, 'src', 'orbital', 'README.md'), 'utf-8');
  const section = readme.slice(readme.indexOf('## LMB penetrator'));
  assert.ok(section.length > 20, 'no "## LMB penetrator" section');
  for (const [what, id] of [
    ['keep list', 'L0-xasm6'],
    ['frame', 'L0-pntr-cx01'],
    ['nested', 'L0-pntr-as05'],
    ['waterlogged', 'L0-pntr-as04'],
  ]) {
    const line = section.split('\n').find((l) => l.toLowerCase().includes(what) && l.includes(id));
    assert.ok(line !== undefined, `no line on "${what}" citing ${id}`);
  }
  assert.ok(section.includes('L0-pntr-cons'), 'PN-6 is cited');
});
