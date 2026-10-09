// Storm Blade active off the engine (spec §02; L0-strm-pact, L0-strm-rcd, L0-strm-rvis, L0-strm-adtr, L0-adr-sblt).
//
// - src/storm/trace.ts runs with no engine at all over a fake block reader that keeps the probe's cell-step budget
//   (docs/feedback/probe-storm.md P5, probe-katana.md P2b).
// - src/storm/visuals.ts runs against an in-memory @minecraft/server whose ticks the test steps by hand.
// - The static guards read src/storm/ as text. The GameTest twin is src/gametest/storm-active.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const STORM = join(projectRoot, 'src', 'storm');

async function load(entry, plugins = []) {
  const out = await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    external: plugins.length === 0 ? ['@minecraft/*'] : [],
    plugins,
  });
  const text = out.outputFiles[0].text;
  return { text, mod: await import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64')) };
}

const traceBundle = await load(join(STORM, 'trace.ts'));
const { ACTIVE_RANGE, planLine, pick } = traceBundle.mod;
const { trace, KATANA_RANGE, TRACE_FLAGS } = (await load(join(projectRoot, 'src', 'katana', 'plan.ts'))).mod;

// ------------------------------------------------------------------ the fake block reader (full blocks only)

const AXES = ['x', 'y', 'z'];
const KIND = {
  'minecraft:stone': 'solid',
  'minecraft:short_grass': 'passable',
  'minecraft:white_carpet': 'passable',
  'minecraft:torch': 'passable',
  'minecraft:water': 'liquid',
};
const FACE = { x: ['West', 'East'], y: ['Down', 'Up'], z: ['North', 'South'] };
const keyOf = (c) => `${c.x},${c.y},${c.z}`;
const floorV = (p) => ({ x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) });
const frac = (p) => ({ x: p.x - Math.floor(p.x), y: p.y - Math.floor(p.y), z: p.z - Math.floor(p.z) });
const along = (from, dir, t) => ({ x: from.x + dir.x * t, y: from.y + dir.y * t, z: from.z + dir.z * t });
const unit = (v) => {
  const n = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / n, y: v.y / n, z: v.z / n };
};
const towards = (from, to) => unit({ x: to.x - from.x, y: to.y - from.y, z: to.z - from.z });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function* walk(from, dir) {
  const cell = floorV(from);
  const next = {};
  const delta = {};
  for (const a of AXES) {
    delta[a] = dir[a] === 0 ? Infinity : 1 / Math.abs(dir[a]);
    next[a] = dir[a] > 0 ? (cell[a] + 1 - from[a]) / dir[a] : dir[a] < 0 ? (from[a] - cell[a]) / -dir[a] : Infinity;
  }
  let t = 0;
  for (;;) {
    yield { cell: { ...cell }, t };
    const a = next.x <= next.y && next.x <= next.z ? 'x' : next.y <= next.z ? 'y' : 'z';
    if (!Number.isFinite(next[a])) return;
    t = next[a];
    cell[a] += Math.sign(dir[a]);
    next[a] += delta[a];
  }
}

/** Where a ray enters the unit box of `cell`. */
function boxHit(from, dir, cell) {
  let near = -Infinity;
  let far = Infinity;
  let axis = 'x';
  for (const a of AXES) {
    if (dir[a] === 0) {
      if (from[a] < cell[a] || from[a] > cell[a] + 1) return null;
      continue;
    }
    let t1 = (cell[a] - from[a]) / dir[a];
    let t2 = (cell[a] + 1 - from[a]) / dir[a];
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > near) {
      near = t1;
      axis = a;
    }
    far = Math.min(far, t2);
  }
  if (near > far || far < 0) return null;
  const t = Math.max(near, 0);
  return { t, face: FACE[axis][dir[axis] > 0 ? 0 : 1], point: along(from, dir, t) };
}

class FakeWorld {
  constructor({ loaded = () => true } = {}) {
    this.loaded = loaded;
    this.heightRange = { min: -64, max: 320 };
    this.cells = new Map();
    this.rayThrows = false;
    this.entityRays = [];
    this.entities = [];
  }

  set(cell, typeId) {
    this.cells.set(keyOf(cell), typeId);
    return this;
  }

  isChunkLoaded(location) {
    const c = floorV(location);
    return this.loaded(c.x, c.z);
  }

  getBlock(location) {
    const c = floorV(location);
    if (!this.loaded(c.x, c.z)) throw new Error('LocationInUnloadedChunkError');
    const typeId = this.cells.get(keyOf(c)) ?? 'minecraft:air';
    return { typeId, isAir: typeId === 'minecraft:air', location: c };
  }

  /** `maxDistance` budgets cell steps (probe-katana P2b, probe-storm P5); an unloaded cell throws. */
  getBlockFromRay(from, dir, { maxDistance, includePassableBlocks = false, includeLiquidBlocks = false }) {
    if (this.rayThrows) throw new Error('LocationInUnloadedChunkError: fake');
    const budget = Math.floor(maxDistance + 1e-9);
    let step = 0;
    for (const { cell } of walk(from, dir)) {
      if (!this.loaded(cell.x, cell.z)) throw new Error(`LocationInUnloadedChunkError: ${keyOf(cell)}`);
      const typeId = this.cells.get(keyOf(cell));
      const kind = typeId === undefined ? undefined : KIND[typeId];
      const stops = kind === 'solid' || (kind === 'passable' && includePassableBlocks) || (kind === 'liquid' && includePassableBlocks && includeLiquidBlocks);
      if (stops) {
        const h = boxHit(from, dir, cell);
        if (h !== null) return { block: { location: cell, typeId }, face: h.face, faceLocation: frac(h.point) };
      }
      if (++step > budget) return undefined;
    }
    return undefined;
  }

  /** Entities are boxes `{ id, lo, hi }`; the distance is to the near face, as the engine reports it (P5). */
  getEntitiesFromRay(from, dir, options) {
    this.entityRays.push(options);
    const out = [];
    for (const e of this.entities) {
      let near = -Infinity;
      let far = Infinity;
      for (const a of AXES) {
        if (dir[a] === 0) {
          if (from[a] < e.lo[a] || from[a] > e.hi[a]) near = Infinity;
          continue;
        }
        let t1 = (e.lo[a] - from[a]) / dir[a];
        let t2 = (e.hi[a] - from[a]) / dir[a];
        if (t1 > t2) [t1, t2] = [t2, t1];
        near = Math.max(near, t1);
        far = Math.min(far, t2);
      }
      if (near <= far && far >= 0 && near <= options.maxDistance) out.push({ entity: e, distance: Math.max(0, near) });
    }
    // Reverse order: pick must sort, not trust the engine's order (P5 saw it on one pair only).
    return out.reverse();
  }
}

/** A standing mob-sized box centred on (x, z), feet at y. */
const box = (id, x, y, z, half = 0.3, height = 1.8) => ({ id, lo: { x: x - half, y, z: z - half }, hi: { x: x + half, y: y + height, z: z + half } });

const HEAD = { x: 0.5, y: 65.62, z: 0.5 };
const EAST = { x: 1, y: 0, z: 0 };
const DIAG = unit({ x: 1, y: 0, z: 1 });

// ------------------------------------------------------------------ the trace

test('trace.ts imports @minecraft/server for types only and loads under plain node', () => {
  const source = readFileSync(join(STORM, 'trace.ts'), 'utf8');
  const statements = source.match(/^(?:import|export)\b[^;]*?["']@minecraft\/[^"']+["']/gm) ?? [];
  for (const s of statements) assert.match(s, /^import type \{/, `runtime engine import: ${s}`);
  assert.doesNotMatch(traceBundle.text, /@minecraft\//);
  assert.equal(ACTIVE_RANGE, 10);
});

test('the Katana trace is the one imported, and its default range stays 20 (L0-strm-adtr)', () => {
  const source = readFileSync(join(STORM, 'trace.ts'), 'utf8');
  assert.match(source, /import \{[^}]*\btrace\b[^}]*\} from "\.\.\/katana\/plan"/);
  assert.doesNotMatch(source, /getBlockFromRay|maxDistance:\s*ACTIVE_RANGE|includePassableBlocks/, 'trace.ts casts no block ray of its own');
  const w = new FakeWorld();
  assert.equal(KATANA_RANGE, 20);
  assert.ok(Math.abs(dist(trace(w, HEAD, EAST).endpoint, HEAD) - 20) < 1e-9, 'default range');
  assert.ok(Math.abs(dist(trace(w, HEAD, EAST, 10).endpoint, HEAD) - 10) < 1e-9, 'range 10');
  const wall = new FakeWorld().set({ x: 15, y: 65, z: 0 }, 'minecraft:stone');
  const far = trace(wall, HEAD, EAST);
  assert.equal(far.stoppedBy, 'block', 'the Katana still sees a wall at 14.5');
  assert.equal(trace(wall, HEAD, EAST, 10).stoppedBy, 'range', 'range 10 does not');
});

test('the fake keeps P5 B: maxDistance 10 misses a stepped diagonal wall at 7.78, and the line stops at it', () => {
  const w = new FakeWorld();
  // A stepped wall across the xz diagonal, 7.78 out from a cell centre (probe-storm P5 B).
  const head = { x: 0.5, y: 65.6, z: 0.5 };
  for (let i = -3; i <= 3; i++) w.set({ x: 6 + i, y: 65, z: 6 - i }, 'minecraft:stone').set({ x: 6 + i, y: 65, z: 5 - i }, 'minecraft:stone');
  assert.equal(w.getBlockFromRay(head, DIAG, { ...TRACE_FLAGS, maxDistance: 10 }), undefined, 'a plain maxDistance 10 passes the wall');
  const line = planLine(w, head, { x: 3, y: 0, z: 3 });
  assert.equal(line.stoppedBy, 'block');
  assert.ok(line.length > 7 && line.length < 8, `stop at ${line.length}`);
  assert.ok(Math.abs(dist(line.stop, head) - line.length) < 1e-9);
  // A target behind the wall is past the stop: it is never asked.
  w.entities.push(box('behind', 7.0, 65, 7.0));
  assert.equal(pick(w, line, () => true), undefined);
  assert.equal(w.entityRays.at(-1).maxDistance, line.length);
});

test('an axis wall: the line ends on its face, not 0.3 short like the Katana endpoint (P5 A1)', () => {
  const w = new FakeWorld().set({ x: 6, y: 65, z: 0 }, 'minecraft:stone');
  const line = planLine(w, HEAD, EAST);
  assert.equal(line.stoppedBy, 'block');
  assert.equal(line.face, 'West');
  assert.ok(Math.abs(line.length - 5.5) < 1e-9, `length ${line.length}`);
  assert.deepEqual(line.block, { x: 6, y: 65, z: 0 });
});

test('open air: the line is exactly 10 blocks on the axis, the xz diagonal and a climbing diagonal', () => {
  for (const view of [EAST, DIAG, { x: 1, y: 0.7, z: -1 }]) {
    const line = planLine(new FakeWorld(), HEAD, view);
    assert.equal(line.stoppedBy, 'range');
    assert.ok(Math.abs(line.length - 10) < 1e-9, `${JSON.stringify(view)}: ${line.length}`);
  }
  // Not normalised by the caller: the length must not scale with it.
  const scaled = planLine(new FakeWorld(), HEAD, { x: 5, y: 0, z: 0 });
  assert.ok(Math.abs(scaled.length - 10) < 1e-9);
});

test('grass, carpet, a torch and water do not stop the line (L0-xasm31)', () => {
  const w = new FakeWorld()
    .set({ x: 2, y: 65, z: 0 }, 'minecraft:short_grass')
    .set({ x: 3, y: 65, z: 0 }, 'minecraft:white_carpet')
    .set({ x: 4, y: 65, z: 0 }, 'minecraft:torch')
    .set({ x: 5, y: 65, z: 0 }, 'minecraft:water');
  const line = planLine(w, HEAD, EAST);
  assert.equal(line.stoppedBy, 'range');
  w.entities.push(box('cow', 6.5, 64.5, 0.5));
  assert.equal(pick(w, line, () => true).entity.id, 'cow');
  assert.equal(w.entityRays.at(-1).ignoreBlockCollision, true, 'the entity ray alone stops at grass and torches (P5)');
});

test('an unloaded chunk ends the line short of it; a ray that throws anyway is no line', () => {
  // Loading is per 16-block chunk: the chunk from x = 16 on is not loaded.
  const w = new FakeWorld({ loaded: (x) => x < 16 });
  const line = planLine(w, { ...HEAD, x: 10.5 }, EAST);
  assert.equal(line.stoppedBy, 'unreadable');
  assert.ok(Math.abs(line.length - 5.45) < 1e-9, `length ${line.length}`);
  const throwing = new FakeWorld();
  throwing.rayThrows = true;
  assert.equal(planLine(throwing, HEAD, EAST), undefined);
  assert.equal(planLine(new FakeWorld(), HEAD, { x: 0, y: 0, z: 0 }), undefined);
});

// ------------------------------------------------------------------ the one target

test('pick: the nearest eligible entity, whatever order the ray returns them in; the one behind is never chosen', () => {
  const w = new FakeWorld();
  w.entities.push(box('first', 4.5, 64.5, 0.5), box('second', 6.5, 64.5, 0.5));
  const line = planLine(w, HEAD, EAST);
  const hit = pick(w, line, () => true);
  assert.equal(hit.entity.id, 'first');
  assert.ok(Math.abs(hit.distance - 3.7) < 1e-9);
  assert.ok(Math.abs(hit.point.x - 4.2) < 1e-9 && hit.point.y === HEAD.y, 'the point is where the line enters the box');
  assert.equal(pick(w, line, (e) => e.id !== 'first').entity.id, 'second', 'an ineligible first is skipped, e.g. the wielder (P5 E)');
});

test('pick: 9.5 out is hit and 10.5 out is not, on the axis and on the diagonal (L0-strm-act 1)', () => {
  for (const [dir, label] of [[EAST, 'axis'], [DIAG, 'diagonal']]) {
    for (const [d, want] of [[9.5, true], [10.5, false]]) {
      const w = new FakeWorld();
      const c = along(HEAD, dir, d);
      w.entities.push(box('t', c.x, 64.5, c.z));
      const got = pick(w, planLine(w, HEAD, dir), () => true);
      assert.equal(got !== undefined, want, `${label} ${d}`);
      if (got !== undefined) assert.ok(got.distance <= 10);
    }
  }
});

test('pick: a hit the engine reports past the stop is dropped; a zero-length line casts no entity ray', () => {
  const liar = {
    calls: 0,
    getEntitiesFromRay() {
      this.calls++;
      return [{ entity: { id: 'far' }, distance: 6 }];
    },
  };
  const line = { head: HEAD, dir: EAST, stop: along(HEAD, EAST, 5), length: 5, stoppedBy: 'block' };
  assert.equal(pick(liar, line, () => true), undefined);
  assert.equal(pick(liar, { ...line, length: 0 }, () => true), undefined);
  assert.equal(liar.calls, 1);
});

// ------------------------------------------------------------------ the visuals, on a stubbed engine

const engineStub = `
const mc = (globalThis.__stormMc = { intervals: new Map(), runIntervalCalls: 0, otherScheduling: 0, nextRun: 1, tick: 0 });
export const system = {
  get currentTick() { return mc.tick; },
  runInterval(fn, ticks) { const id = mc.nextRun++; mc.intervals.set(id, { fn, ticks }); mc.runIntervalCalls++; return id; },
  clearRun(id) { mc.intervals.delete(id); },
  run() { mc.otherScheduling++; return mc.nextRun++; },
  runTimeout() { mc.otherScheduling++; return mc.nextRun++; },
  runJob() { mc.otherScheduling++; return mc.nextRun++; },
};
`;
const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({ contents: engineStub, loader: 'js' }));
  },
};
const visuals = (await load(join(STORM, 'visuals.ts'), [stubPlugin])).mod;
const mc = globalThis.__stormMc;

/** A dimension that records particles and sounds and throws on anything else it is asked for. */
function recordingDimension() {
  const calls = [];
  const dim = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'spawnParticle') return (id, at) => calls.push({ kind: 'particle', id, at: { ...at }, tick: mc.tick });
        if (prop === 'playSound') return (id, at, opts) => calls.push({ kind: 'sound', id, at: { ...at }, opts, tick: mc.tick });
        if (prop === 'then') return undefined;
        throw new Error(`visuals touched dimension.${String(prop)}`);
      },
    }
  );
  return { dim, calls };
}

function stepTicks(n) {
  for (let i = 0; i < n; i++) {
    mc.tick++;
    for (const { fn } of [...mc.intervals.values()]) fn();
  }
}

test('visuals: one interval for two releases in one tick, every particle from it, and none left after the last strike', () => {
  const { dim, calls } = recordingDimension();
  const before = visuals.visualStats();
  assert.equal(before.running, false, 'no interval while idle');
  const release = mc.tick;
  const foot = { x: 8, y: 64, z: 0.5 };
  for (const z of [0.5, 3.5]) {
    visuals.drawLine(dim, { x: 0.5, y: 65.62, z }, { x: 8.2, y: 65.62, z });
    visuals.playStrikes(dim, { ...foot, z }, { x: 8.2, y: 65.62, z }, visuals.ACTIVE_STRIKE_DELAYS);
  }
  assert.equal(calls.length, 0, 'nothing is drawn in the release tick: it all goes through the interval');
  assert.equal(mc.runIntervalCalls, 1);
  assert.equal([...mc.intervals.values()][0].ticks, 1);
  stepTicks(10);
  const after = visuals.visualStats();
  assert.equal(after.loopStarts - before.loopStarts, 1);
  assert.equal(after.running, false, 'the interval is cleared once the queue is empty');
  assert.equal(mc.intervals.size, 0);
  assert.equal(after.loopRuns - before.loopRuns, Math.max(...visuals.ACTIVE_STRIKE_DELAYS), 'it ran until the last strike and stopped');
  assert.equal(mc.otherScheduling, 0, 'no system.run, runTimeout or runJob');
  const sounds = calls.filter((c) => c.kind === 'sound');
  assert.equal(sounds.length, 6, 'three strikes per release');
  assert.deepEqual([...new Set(sounds.map((s) => s.tick - release))], [1, 3, 5]);
  assert.ok(sounds.every((s) => s.id === visuals.STRIKE_SOUND));
  assert.ok(calls.every((c) => c.tick - release >= 1 && c.tick - release <= 6), 'all of it inside 6 ticks');
  const ids = new Set(calls.filter((c) => c.kind === 'particle').map((c) => c.id));
  assert.deepEqual([...ids].sort(), [...visuals.STORM_PARTICLES].sort());
  stepTicks(40);
  assert.equal(visuals.visualStats().loopRuns, after.loopRuns, 'idle: no periodic work');
});

test('visuals: the line is a point every half block from just past the eye to its end; a strike column ends on its foot', () => {
  const from = { x: 0, y: 0, z: 0 };
  const pts = visuals.linePoints(from, { x: 10, y: 0, z: 0 });
  assert.equal(pts.length, 20);
  assert.ok(Math.abs(pts[0].x - 0.5) < 1e-9);
  assert.deepEqual(pts.at(-1), { x: 10, y: 0, z: 0 });
  assert.equal(visuals.linePoints(from, { x: 0.2, y: 0, z: 0 }).length, 1, 'a wall at the eye still shows its end');
  const foot = { x: 3, y: 64, z: -2 };
  const col = visuals.strikePoints(foot, 2);
  assert.equal(col.length, 13);
  assert.ok(Math.abs(col[0].y - (64 + visuals.STRIKE_HEIGHT)) < 1e-9);
  assert.deepEqual(col.at(-1), foot);
  assert.ok(col.every((p) => Math.hypot(p.x - foot.x, p.z - foot.z) <= 0.5));
});

test('visuals: the particle ids are declared in the vanilla resource pack the probe read (probe-storm P1)', () => {
  const list = readFileSync(join(projectRoot, 'packs', 'gametest', 'storm-probe', 'vanilla-particles-v1.26.50.4.txt'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('minecraft:'));
  assert.ok(list.length > 150, 'the list is the whole vanilla set');
  for (const id of visuals.STORM_PARTICLES) assert.ok(list.includes(id), `${id} is not a vanilla particle`);
  assert.equal(visuals.SPARK_PARTICLE, 'minecraft:electric_spark_particle');
  assert.equal(visuals.WIND_PARTICLE, 'minecraft:wind_explosion_emitter');
  assert.equal(visuals.FLASH_PARTICLE, 'minecraft:huge_explosion_lab_misc_emitter');
});

// ------------------------------------------------------------------ static guards (AC3, AC7, L0-strm-rvis)

const stormFiles = readdirSync(STORM).map((name) => ({ name, text: readFileSync(join(STORM, name), 'utf8') }));
const tsFiles = stormFiles.filter((f) => f.name.endsWith('.ts'));
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const count = (text, re) => (code(text).match(re) ?? []).length;

test('no vanilla lightning entity anywhere in src/storm/, README included (L0-strm-rvis, L0-adr-sblt)', () => {
  for (const f of stormFiles) assert.doesNotMatch(f.text, /lightning_bolt/, f.name);
});

test('one shared interval: runInterval once in src/storm/, in visuals.ts; no runJob; particles and sounds only in visuals.ts (AC7)', () => {
  const intervals = tsFiles.map((f) => [f.name, count(f.text, /\brunInterval\s*\(/g)]).filter(([, n]) => n > 0);
  assert.deepEqual(intervals, [['visuals.ts', 1]]);
  for (const f of tsFiles) assert.equal(count(f.text, /\brunJob\b/g), 0, `${f.name} uses runJob`);
  for (const f of tsFiles.filter((f) => f.name !== 'visuals.ts')) {
    assert.equal(count(f.text, /\bspawnParticle\s*\(|\bplaySound\s*\(/g), 0, `${f.name} draws outside visuals.ts`);
  }
  const visualsTs = tsFiles.find((f) => f.name === 'visuals.ts').text;
  assert.equal(count(visualsTs, /\bsystem\.(run|runTimeout)\s*\(/g), 0, 'visuals.ts schedules nothing but its interval');
  assert.equal(count(visualsTs, /\bspawnEntity\b|\bsummon\b|\bsetBlock|\bsetType\b|\bsetPermutation\b|\brunCommand\b|\bapplyDamage\b/g), 0);
});

test('the active deals damage only through the helper and hooks no melee (AC3, AC6)', () => {
  for (const name of ['active.ts', 'trace.ts', 'visuals.ts']) {
    const text = tsFiles.find((f) => f.name === name).text;
    assert.equal(count(text, /\bapplyDamage\b|\bsetCurrentValue\b|\bafterArmour\b|\bplanStrike\b|\bresetToMaxValue\b/g), 0, `${name} computes or writes damage`);
    assert.equal(count(text, /\bentityHurt\b|\bentityHitEntity\b|\.cancel\b/g), 0, `${name} hooks a hit`);
  }
  const active = code(tsFiles.find((f) => f.name === 'active.ts').text);
  assert.match(active, /import \{[^}]*\bstormDamage\b[^}]*\} from "\.\/damage"/);
  assert.equal((active.match(/\bstormDamage\s*\(/g) ?? []).length, 1);
  assert.match(active, /stormDamage\([^,]+,\s*ACTIVE_DAMAGE\s*,/);
  assert.equal((active.match(/\bstartCooldown\s*\(/g) ?? []).length, 1, 'one place spends the cooldown');
});
