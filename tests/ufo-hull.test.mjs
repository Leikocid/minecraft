// The UFO shoot-down over fakes: the hull test of R-sauc-1 at any fall speed
// (src/ufo/shootdown.ts), the interceptor seam on the Orbital flight
// (src/orbital/flight.ts, L0-adr-ufoi, L0-sauc-p003) against a fake engine,
// and the saucer's latch, fall, blast, reward and broadcast against the real
// core's clock (L0-sauc-p002, r004, L0-adr-ufsd). The engine half is
// src/gametest/ufo-shootdown.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(contents, engineStub) {
  const plugin = {
    name: 'minecraft-server-stub',
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: '@minecraft/server', namespace: 'mc-stub' }));
      pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({ contents: engineStub, loader: 'js' }));
    },
  };
  const bundle = await build({
    stdin: { contents, resolveDir: projectRoot, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    plugins: [plugin],
  });
  const src = bundle.outputFiles[0].text + `\n// ${Math.random()}`;
  return import('data:text/javascript;base64,' + Buffer.from(src, 'utf-8').toString('base64'));
}

// The shoot-down and the saucer must stay free of runtime engine imports: this stub throws on load if one appears.
const NO_ENGINE = 'throw new Error("src/ufo/ must stay free of runtime @minecraft/server imports");';
const m = await load(
  `
  export * from './src/ufo/shootdown.ts';
  export { createSaucer, UFO_SOUNDS, legPosition } from './src/ufo/saucer.ts';
  export { UfoCore } from './src/ufo/event.ts';
  export { NEXT_MS } from './src/ufo/schedule.ts';
  export { PAUSE_MS, FIRST_MIN_MS, FIRST_MAX_MS } from './src/ufo/env.ts';
  export { fallStep as chargeFallStep, FALL_SPEED } from './src/orbital/charge.ts';`,
  NO_ENGINE
);
const {
  HULL_RADIUS,
  HULL_HEIGHT,
  FALL_ACCEL,
  REWARD,
  SHOT_DOWN_TEXT,
  UNKNOWN_SHOOTER,
  BLAST_PARTICLE,
  SMOKE_PARTICLE,
  SMOKE_PER_TICK,
  hullHit,
  fallStep,
  landingCell,
  shooterName,
  createSaucer,
  UFO_SOUNDS,
  UfoCore,
  NEXT_MS,
  PAUSE_MS,
  FIRST_MIN_MS,
  FIRST_MAX_MS,
  chargeFallStep,
  FALL_SPEED,
} = m;

const at = (x, y, z) => ({ x, y, z });

// ------------------------------------------------------------------ AC#1: the hull test (R-sauc-1)

test('hull: r 6 × h 3 standing on the position — a segment through the band within 6 of the axis hits, edges closed', () => {
  assert.deepEqual([HULL_RADIUS, HULL_HEIGHT], [6, 3]);
  const S = at(10.5, 100, -6.5);
  const seg = (dx, top, bottom) => hullHit(S, at(S.x + dx, top, S.z), at(S.x + dx, bottom, S.z));
  for (const dx of [0, 3, 5.99, 6]) {
    assert.equal(seg(dx, 103.5, 102.5), true, `${dx} out, through the top`);
    assert.equal(seg(dx, 110, 90), true, `${dx} out, a segment longer than the hull`);
    assert.equal(seg(dx, 103, 102), true, `${dx} out, from exactly the top edge`);
    assert.equal(seg(dx, 101, 100), true, `${dx} out, down to exactly the bottom edge`);
    assert.equal(seg(dx, 101.2, 101.1), true, `${dx} out, inside the band`);
  }
  assert.equal(hullHit(S, at(S.x + 4.2, 101, S.z - 4.2), at(S.x + 4.2, 100, S.z - 4.2)), true, 'diagonal 5.94 out');
  for (const dx of [6.01, 7, 30]) assert.equal(seg(dx, 110, 90), false, `${dx} out: outside the cylinder`);
  assert.equal(hullHit(S, at(S.x + 4.3, 101, S.z - 4.3), at(S.x + 4.3, 100, S.z - 4.3)), false, 'diagonal 6.08 out');
  assert.equal(seg(0, 104, 103.01), false, 'wholly above the band');
  assert.equal(seg(0, 99.99, 98.99), false, 'wholly below the band');
  assert.equal(seg(0, 99, 60), false, 'a fall that starts under the hull');
  assert.equal(hullHit(S, at(S.x, 102.5, S.z), at(S.x, 103.5, S.z)), true, 'the order of the ends does not matter');
});

const SPEEDS = [0.25, 0.3, 0.5, FALL_SPEED, 1.5, 2, 2.5, 3.7, 7, 16, 40, 100, 1000];
const STARTS = [160, 160.5, 133.99, 103.2, 120.01];

/**
 * The segments the flight offers a charge falling from `start` at `speed`
 * through open air: one per move, and the last one down to the floor — the
 * floor of the world (void) or the top of a roof at `floor` (contact).
 */
function sweep(start, speed, floor, roof = false) {
  const segs = [];
  let y = start;
  for (let guard = 0; guard < 100000; guard++) {
    const next = chargeFallStep(y, floor, (cellY) => (roof && cellY === floor ? 'contact' : 'clear'), speed);
    if (next.kind === 'move') {
      segs.push([y, next.y]);
      y = next.y;
      continue;
    }
    if (next.kind === 'contact') segs.push([y, next.cellY + 1]);
    if (next.kind === 'void') segs.push([y, floor]);
    break;
  }
  return segs;
}

test('hull: a falling charge is caught at any fall speed, on the first step whose segment reaches the band, and never outside it', () => {
  const S = at(0.5, 100, 0.5);
  for (const speed of SPEEDS) {
    for (const start of STARTS) {
      const segs = sweep(start, speed, -64);
      const overlaps = segs.map(([y, ny]) => ny <= S.y + HULL_HEIGHT && y >= S.y);
      const first = overlaps.indexOf(true);
      assert.ok(first >= 0, `speed ${speed}, start ${start}: the path never reaches the band`);
      for (const dx of [0, 2.5, 6]) {
        const hits = segs.map(([y, ny]) => hullHit(S, at(S.x + dx, y, S.z), at(S.x + dx, ny, S.z)));
        assert.deepEqual(hits, overlaps, `speed ${speed}, start ${start}, ${dx} out`);
        assert.equal(hits.indexOf(true), first);
      }
      for (const dx of [6.01, 9]) {
        assert.ok(!segs.some(([y, ny]) => hullHit(S, at(S.x + dx, y, S.z), at(S.x + dx, ny, S.z))), `speed ${speed}, start ${start}: a hit ${dx} out`);
      }
    }
  }
});

test('hull: a path that ends above the hull, or runs wholly under it, is never a hit', () => {
  const S = at(0.5, 100, 0.5);
  for (const speed of SPEEDS) {
    // A roof at 109 stops the charge on its top, 110, before the band.
    const roofed = sweep(160, speed, 109, true);
    assert.ok(!roofed.some(([y, ny]) => hullHit(S, at(S.x, y, S.z), at(S.x, ny, S.z))), `speed ${speed}: a hit through a roof above the hull`);
    const under = sweep(99.5, speed, -64);
    assert.ok(!under.some(([y, ny]) => hullHit(S, at(S.x, y, S.z), at(S.x, ny, S.z))), `speed ${speed}: a hit from below the hull`);
  }
});

test('hull, negative control: testing the charge position alone, not the segment, misses the hull at a fast fall', () => {
  const S = at(0.5, 100, 0.5);
  const pointHit = (y) => y >= S.y && y <= S.y + HULL_HEIGHT;
  const missed = [];
  for (const speed of SPEEDS) {
    for (const start of STARTS) {
      const segs = sweep(start, speed, -64);
      const bySegment = segs.some(([y, ny]) => hullHit(S, at(S.x, y, S.z), at(S.x, ny, S.z)));
      const byPoint = segs.some(([, ny]) => pointHit(ny));
      assert.ok(bySegment, `speed ${speed}, start ${start}`);
      if (!byPoint) missed.push(`${speed}@${start}`);
    }
  }
  assert.ok(missed.length > 0, 'the point test caught every fall — this control proves nothing about the sweep');
  assert.ok(missed.every((k) => Number(k.split('@')[0]) > HULL_HEIGHT), `the point test missed at a speed the band holds: ${missed.join(' ')}`);
});

test('fall: from rest, FALL_ACCEL a tick²; from the hover height 40 up the ground comes inside the 60-step cap, from the legs (+50) it does not', () => {
  assert.equal(FALL_ACCEL, 0.025);
  let s = { y: 40, vy: 0 };
  let steps = 0;
  while (s.y > 0) {
    s = fallStep(s.y, s.vy);
    steps++;
  }
  assert.ok(steps <= 60 && steps >= 55, `40 blocks in ${steps} steps`);
  s = { y: 50, vy: 0 };
  for (let i = 0; i < 60; i++) s = fallStep(s.y, s.vy);
  assert.ok(s.y > 0 && Math.abs(50 - s.y - FALL_ACCEL * 60 * 61 / 2) < 1e-9, `after 60 steps from 50: ${s.y}`);
});

test('fall: landingCell is the first non-air cell the bottom enters, top first, never below minY', () => {
  const solidAt = (set) => (y) => !set.has(y);
  assert.equal(landingCell(50, 49.975, -64, solidAt(new Set([49]))), 49, 'the cell under an integer bottom is checked at once');
  assert.equal(landingCell(49.975, 49.925, -64, solidAt(new Set([49]))), undefined, 'a cell already passed is not read again');
  assert.equal(landingCell(10, 5.5, -64, solidAt(new Set([8, 6]))), 8, 'the higher of two cells');
  assert.equal(landingCell(10, 5.5, -64, () => true), undefined);
  assert.equal(landingCell(-62, -70, -64, solidAt(new Set([-65, -66]))), undefined, 'cells below minY do not exist');
});

test('shooterName: the live player first, then the name the attack carries, then "?"', () => {
  const players = [undefined, { id: 'p1', name: 'Alice', sendMessage() {} }];
  assert.equal(shooterName({ ownerId: 'p1', ownerName: 'Old' }, players), 'Alice');
  assert.equal(shooterName({ ownerId: 'p2', ownerName: 'Bob' }, players), 'Bob');
  assert.equal(shooterName({ ownerId: 'p2' }, players), UNKNOWN_SHOOTER);
  assert.equal(UNKNOWN_SHOOTER, '?');
});

// ------------------------------------------------------------------ AC#4: the seam on the flight (L0-sauc-p003)

const engineStub = `
const mc = (globalThis.__hullMc = { tick: 0, intervals: new Map(), runs: [], nextId: 1, dims: new Map() });
export class LocationInUnloadedChunkError extends Error {}
export const system = {
  get currentTick() { return mc.tick; },
  runInterval(cb) { const id = mc.nextId++; mc.intervals.set(id, cb); return id; },
  clearRun(id) { mc.intervals.delete(id); },
  run(cb) { mc.runs.push(cb); return mc.nextId++; },
};
const signal = () => ({ subscribe(cb) { return cb; }, unsubscribe() {} });
export const world = {
  afterEvents: new Proxy({}, { get: (t, n) => (t[n] ??= signal()) }),
  getDimension(id) { return mc.dims.get(String(id).replace('minecraft:', '')); },
};
`;
const flight = await load(["export * from './src/orbital/flight.ts';", "export { registerEffect } from './src/orbital/charge.ts';"].join('\n'), engineStub);
const mc = globalThis.__hullMc;
const warnings = [];
console.warn = (msg) => warnings.push(String(msg));

class FakeEntity {
  constructor(location) {
    this.id = String(5000 + mc.nextId++);
    this.typeId = 'andrew:orbital_charge';
    this.location = { ...location };
    this.isValid = true;
    this.trail = [location.y];
  }
  teleport(location) {
    this.location = { ...location };
    this.trail.push(location.y);
  }
  remove() {
    this.isValid = false;
    this.removedTick = mc.tick;
  }
  getTags() {
    return [];
  }
}

const overworld = {
  id: 'minecraft:overworld',
  heightRange: { min: -64, max: 320 },
  blocks: new Map(),
  set(x, y, z, typeId) {
    this.blocks.set(`${x},${y},${z}`, typeId);
  },
  getBlock({ x, y, z }) {
    const typeId = this.blocks.get(`${x},${y},${z}`) ?? 'minecraft:air';
    return { typeId, isAir: typeId === 'minecraft:air', isLiquid: false, permutation: { getState: () => undefined } };
  },
};
mc.dims.set('overworld', overworld);

function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    mc.tick++;
    for (const run of mc.runs.splice(0)) run();
    for (const cb of [...mc.intervals.values()]) cb();
  }
}

const detonations = [];
flight.registerEffect('lmb', {
  layout: (t) => [{ x: t.x, z: t.z }],
  scale: 1,
  onDetonate: (dim, point, ownerId, mode, attackId) => detonations.push({ point: { ...point }, attackId, tick: mc.tick }),
});
flight.registerEffect('rmb', {
  layout: (t) => [{ x: t.x, z: t.z }],
  scale: 0,
  onDetonate: (dim, point, ownerId, mode, attackId) => detonations.push({ point: { ...point }, attackId, tick: mc.tick }),
});
const ends = [];
flight.observeChargeEnds((e) => ends.push({ attackId: e.attack.attackId, slot: e.charge.slot, outcome: e.outcome, point: e.point, tick: e.tick, valid: e.charge.entity.isValid }));

let seq = 0;
function attackOf(columns, spawnY, { mode = 'lmb', ownerId = '-77', ownerName } = {}) {
  const attackId = `oc-${mc.tick}-h${++seq}`;
  const charges = columns.map((c, slot) => ({ entity: new FakeEntity({ x: c.x + 0.5, y: spawnY, z: c.z + 0.5 }), slot, x: c.x, z: c.z, y: spawnY }));
  return { attackId, mode, ownerId, ownerName, dimensionId: 'minecraft:overworld', target: { x: columns[0].x, y: 0, z: columns[0].z }, face: undefined, spawnY, charges, createdTick: mc.tick };
}

function settle(limit = 600) {
  for (let i = 0; i < limit && flight.activeAttacks().size > 0; i++) tick();
}

/** One LMB and one three-column RMB attack over stone; what each charge did, relative to its launch. */
function baselineRun(x0) {
  for (const x of [x0, x0 + 3, x0 + 6, x0 + 9]) overworld.set(x, 4, 0, 'minecraft:stone');
  const a = attackOf([{ x: x0, z: 0 }], 34);
  const b = attackOf([{ x: x0 + 3, z: 0 }, { x: x0 + 6, z: 0 }, { x: x0 + 9, z: 0 }], 34.5, { mode: 'rmb' });
  const entities = [...a.charges, ...b.charges].map((c) => c.entity);
  const fired = mc.tick;
  const d0 = detonations.length;
  const e0 = ends.length;
  flight.launch(a);
  flight.launch(b);
  settle();
  return {
    trails: entities.map((e) => e.trail),
    detonations: detonations.slice(d0).map((d) => ({ y: d.point.y, dx: d.point.x - x0, dt: d.tick - fired })),
    ends: ends.slice(e0).map((e) => ({ slot: e.slot, outcome: e.outcome, dt: e.tick - fired, valid: e.valid })),
  };
}

test('seam: with no interceptor — none ever registered, or one registered and taken back — every charge falls, lands and ends exactly as before', () => {
  assert.equal(flight.interceptorCount(), 0);
  const never = baselineRun(100);
  const off = flight.registerInterceptor(() => {
    throw new Error('an unregistered interceptor was called');
  });
  assert.equal(flight.interceptorCount(), 1);
  off();
  assert.equal(flight.interceptorCount(), 0);
  const taken = baselineRun(200);
  assert.deepEqual(taken, never);
  assert.deepEqual(never.trails[0], Array.from({ length: 30 }, (_, i) => 34 - i), 'the LMB charge no longer falls 34 → 5');
  assert.deepEqual(never.detonations.map((d) => d.y), [4, 4, 4, 4]);
  assert.ok(never.ends.every((e) => e.outcome === 'detonated' && e.valid === false));
  assert.ok(!warnings.some((w) => w.includes('interceptor')), 'an empty set logged about interceptors');
});

test('seam: the interceptor sees each step — column centre, feet before and after — and true ends the charge as intercepted, with no effect', () => {
  overworld.set(300, 4, 0, 'minecraft:stone');
  const attack = attackOf([{ x: 300, z: 0 }], 34, { ownerId: '-5', ownerName: 'Alice' });
  const calls = [];
  const off = flight.registerInterceptor((a, charge, from, to, t) => {
    calls.push({ a, charge, from: { ...from }, to: { ...to }, t });
    return to.y <= 20;
  });
  const d0 = detonations.length;
  const fired = mc.tick;
  flight.launch(attack);
  const entity = attack.charges[0].entity;
  settle();
  off();
  assert.equal(calls[0].a, attack, 'the interceptor does not get the attack itself');
  assert.equal(calls[0].a.ownerName, 'Alice');
  assert.deepEqual([calls[0].from, calls[0].to], [at(300.5, 34, 0.5), at(300.5, 33, 0.5)]);
  assert.equal(calls[0].t, fired + 1);
  assert.equal(calls.length, 14, '34 → 20 is 14 steps');
  assert.deepEqual(calls.at(-1).to, at(300.5, 20, 0.5));
  assert.equal(detonations.length, d0, 'an intercepted charge detonated');
  assert.equal(entity.isValid, false);
  assert.equal(entity.trail.at(-1), 21, 'the charge moved into the step that took it');
  assert.deepEqual(ends.at(-1), { attackId: attack.attackId, slot: 0, outcome: 'intercepted', point: undefined, tick: fired + 14, valid: false });
  assert.equal(flight.activeAttacks().has(attack.attackId), false);
});

test('seam: the contact step offers its last stretch, down to the top of the block — a hull just above the ground wins; the control detonates', () => {
  const band = (from, to) => Math.min(from.y, to.y) <= 5.2 && Math.max(from.y, to.y) >= 5.0;
  for (const [x, armed] of [
    [400, true],
    [410, false],
  ]) {
    overworld.set(x, 4, 0, 'minecraft:stone');
    const attack = attackOf([{ x, z: 0 }], 34.5);
    const calls = [];
    const off = armed ? flight.registerInterceptor((a, c, from, to) => (calls.push([from.y, to.y]), band(from, to))) : () => {};
    const d0 = detonations.length;
    flight.launch(attack);
    settle();
    off();
    if (armed) {
      assert.deepEqual(calls.at(-1), [5.5, 5], 'the contact step did not offer 5.5 → 5');
      assert.equal(detonations.length, d0);
      assert.equal(ends.at(-1).outcome, 'intercepted');
    } else {
      assert.deepEqual(detonations.slice(d0).map((d) => d.point.y), [4], 'control: no detonation on the stone');
      assert.equal(ends.at(-1).outcome, 'detonated');
    }
  }
});

test('seam: an interceptor that throws is logged and the charge detonates as it would without one', () => {
  overworld.set(500, 4, 0, 'minecraft:stone');
  const attack = attackOf([{ x: 500, z: 0 }], 34);
  const off = flight.registerInterceptor(() => {
    throw new Error('broken saucer');
  });
  const d0 = detonations.length;
  const w0 = warnings.length;
  flight.launch(attack);
  settle();
  off();
  assert.deepEqual(detonations.slice(d0).map((d) => d.point), [at(500, 4, 0)]);
  assert.equal(ends.at(-1).outcome, 'detonated');
  const logged = warnings.slice(w0).filter((w) => w.includes('an interceptor threw'));
  assert.equal(logged.length, 1, `the throw was logged ${logged.length} times over 30 steps, not once`);
  assert.ok(logged[0].includes('broken saucer') && logged[0].includes(attack.attackId));
});

test('seam: a charge that falls into the void is offered the stretch down to the floor of the world', () => {
  const attack = attackOf([{ x: 700, z: 0 }], -60.5);
  const calls = [];
  const off = flight.registerInterceptor((a, c, from, to) => (calls.push([from.y, to.y]), to.y <= -64));
  flight.launch(attack);
  settle();
  off();
  assert.deepEqual(calls.at(-1), [-63.5, -64]);
  assert.equal(ends.at(-1).outcome, 'intercepted');
  const control = attackOf([{ x: 701, z: 0 }], -60.5);
  flight.launch(control);
  settle();
  assert.equal(ends.at(-1).outcome, 'voided', 'control: no interceptor, no void');
});

test('seam: per charge — in a salvo the columns an interceptor takes end intercepted, the others detonate; the first true of several wins', () => {
  const columns = [600, 602, 604, 606].map((x) => ({ x, z: 0 }));
  for (const c of columns) overworld.set(c.x, 4, 0, 'minecraft:stone');
  const attack = attackOf(columns, 34, { mode: 'rmb' });
  const seen = [];
  const offA = flight.registerInterceptor((a, charge, from) => (seen.push('a'), from.x < 603));
  const offB = flight.registerInterceptor((a, charge, from) => (seen.push('b'), from.x > 605 && from.y <= 10));
  const d0 = detonations.length;
  const e0 = ends.length;
  flight.launch(attack);
  settle();
  offA();
  offB();
  const byX = Object.fromEntries(ends.slice(e0).map((e) => [columns[e.slot].x, e.outcome]));
  assert.deepEqual(byX, { 600: 'intercepted', 602: 'intercepted', 604: 'detonated', 606: 'intercepted' });
  assert.deepEqual(detonations.slice(d0).map((d) => d.point.x), [604]);
  assert.ok(seen.includes('a') && seen.includes('b'));
  assert.equal(flight.interceptorCount(), 0);
});

// ------------------------------------------------------------------ the saucer: latch, fall, blast, reward (L0-sauc-p002, r004)

const CENTRE = at(10, -61, -7);
const HOVER = at(CENTRE.x + 0.5, CENTRE.y + 40, CENTRE.z + 0.5);
const OW = 'minecraft:overworld';

function fakeWorld() {
  const w = { tick: 0, spawned: [], played: [], particles: [], items: [], ground: CENTRE.y };
  w.overworld = {
    id: OW,
    heightRange: { min: -64, max: 320 },
    spawnEntity(typeId, location) {
      const e = { id: `s${w.spawned.length}`, typeId, isValid: true, location: { ...location }, tags: [], props: {}, trail: [] };
      e.addTag = (t) => e.tags.push(t);
      e.setDynamicProperty = () => {};
      e.setProperty = (k, v) => (e.props[k] = v);
      e.teleport = (to) => {
        e.location = { ...to };
        e.trail.push({ ...to, tick: w.tick });
      };
      e.remove = () => {
        e.isValid = false;
        e.removedTick = w.tick;
      };
      w.spawned.push(e);
      return e;
    },
    playSound: (id, location) => w.played.push({ id, at: { ...location }, tick: w.tick }),
    spawnParticle: (id, location) => w.particles.push({ id, at: { ...location }, tick: w.tick }),
    spawnItem: (stack, location) => w.items.push({ typeId: stack.typeId, amount: stack.amount, at: { ...location }, tick: w.tick }),
    getBlock: ({ y }) => ({ isAir: y > w.ground }),
  };
  return w;
}

function rig({ durations = { arrival: 40, magnet: 200, departure: 40, downed: 60 }, shootdown = true } = {}) {
  const w = fakeWorld();
  const inbox = { p1: [], p2: [] };
  const players = [
    { id: 'p1', name: 'Alice', sendMessage: (msg) => inbox.p1.push(msg) },
    undefined,
    { id: 'p2', name: 'Bob', sendMessage: (msg) => inbox.p2.push(msg) },
  ];
  const interceptors = new Set();
  const data = new Map();
  let now = 1_790_000_000_000;
  const env = {
    now: () => now,
    durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: () => [{ id: 'p1', name: 'Alice', location: at(CENTRE.x + 0.5, CENTRE.y + 1, CENTRE.z + 0.5), sendMessage() {} }],
    random: () => 0,
    store: { get: (k) => data.get(k), set: (k, v) => (v === undefined ? data.delete(k) : data.set(k, v)) },
    ceiling: () => 320,
    log() {},
  };
  let core;
  const r = { w, inbox, interceptors, data, phases: [] };
  r.saucer = createSaucer({
    overworld: () => w.overworld,
    random: () => 0.5,
    durations,
    ceiling: env.ceiling,
    ...(shootdown
      ? {
          shootdown: {
            registerInterceptor: (fn) => (interceptors.add(fn), () => interceptors.delete(fn)),
            core: () => core,
            players: () => players,
            itemStack: (typeId, amount) => ({ typeId, amount }),
            log() {},
          },
        }
      : {}),
  });
  core = r.core = new UfoCore(env, { scope: 'uh', saucer: r.saucer, listeners: [{ onPhase: (phase) => r.phases.push({ phase, tick: w.tick }) }] });
  r.now = () => now;
  r.tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      now += 50;
      w.tick++;
      core.tick();
    }
  };
  r.until = (cond, max = 10_000) => {
    for (let i = 0; i < max; i++) {
      if (cond()) return;
      r.tick();
    }
    throw new Error('condition never held');
  };
  /** A charge segment offered as the flight step would, after this tick's UFO step. */
  r.charge = (x, z, top, bottom, { ownerId = 'p1', ownerName = 'Alice', dimensionId = OW, attackId = 'gt-1-1' } = {}) => {
    const attack = { attackId, mode: 'lmb', ownerId, ownerName, dimensionId, charges: [] };
    for (const fn of [...interceptors]) if (fn(attack, { slot: 0, x, z }, at(x, top, z), at(x, bottom, z), w.tick)) return true;
    return false;
  };
  r.at = (phase) => r.phases.find((p) => p.phase === phase)?.tick;
  return r;
}

const flatDist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('magnet-phase shot: latched once, the release on the next UFO tick, a smoking fall onto the ground, the blast there, 8 diamonds + 1 totem once, one broadcast naming the owner, next arrival 15 min after the shot', () => {
  const r = rig();
  r.core.command('come', 'p1');
  r.until(() => r.core.session()?.phase === 'magnet');
  r.tick(10);
  assert.equal(r.interceptors.size, 1, 'no interceptor while the saucer flies');
  const e = r.w.spawned[0];
  assert.equal(r.charge(HOVER.x + 6.5, HOVER.z, HOVER.y + 10, HOVER.y + 2), false, 'a column 6.5 out was taken');
  assert.equal(r.charge(HOVER.x, HOVER.z, HOVER.y + 10, HOVER.y + 9), false, 'a step above the hull was taken');
  assert.equal(r.charge(HOVER.x, HOVER.z, HOVER.y + 3.5, HOVER.y + 2.5, { ownerId: 'p2', ownerName: 'Bob', dimensionId: 'minecraft:nether' }), false, 'a Nether charge was taken');
  const shotTick = r.w.tick;
  const shotNow = r.now();
  assert.equal(r.charge(HOVER.x + 3, HOVER.z - 2, HOVER.y + 3.5, HOVER.y + 2.5), true, 'the crossing charge was not taken');
  assert.equal(r.charge(HOVER.x - 4, HOVER.z, HOVER.y + 3.5, HOVER.y + 2.5, { ownerId: 'p2', ownerName: 'Bob', attackId: 'gt-1-2' }), true, 'a second charge in the same tick flew through');
  const shot = r.saucer.shot();
  assert.deepEqual([shot.ownerId, shot.ownerName, shot.attackId, shot.absorbed, shot.leg], ['p1', 'Alice', 'gt-1-1', 2, 'hover']);
  assert.equal(r.core.session().phase, 'downed', 'the core did not enter downed in the shot');
  assert.equal(r.data.get(NEXT_MS), shotNow + PAUSE_MS, 'the next arrival is not 15 min after the shot');

  r.tick();
  assert.equal(r.at('release'), shotTick + 1, 'the magnet was not released on the next UFO tick');
  assert.equal(e.props['andrew:beam'], false, 'the beam stayed on');
  r.until(() => r.core.session() === undefined, 200);
  assert.equal(r.core.lastEnd().reason, 'downed');

  // The fall: from the hover point down onto the ground cell, smoke every step, ≤ 60 steps.
  const blastAt = at(HOVER.x, CENTRE.y + 1, HOVER.z);
  assert.deepEqual(shot.blastAt, blastAt);
  assert.equal(shot.blastBy, 'ground');
  let s = { y: HOVER.y, vy: 0 };
  let steps = 0;
  while (s.y > CENTRE.y + 1) {
    s = fallStep(s.y, s.vy);
    steps++;
  }
  assert.equal(shot.steps, steps);
  assert.ok(steps <= 60);
  assert.ok(e.trail.filter((p) => p.tick > shotTick).every((p) => p.x === HOVER.x && p.z === HOVER.z), 'the fall drifted sideways');
  const smoke = r.w.particles.filter((p) => p.id === SMOKE_PARTICLE);
  assert.equal(smoke.length, (steps - 1) * SMOKE_PER_TICK, 'smoke is not 4 calls on every airborne step');

  // The blast: particles and the sound at the landing point, in the last step; the saucer gone the same tick.
  const blastTick = shotTick + 1 + steps - 1;
  assert.deepEqual(r.w.particles.filter((p) => p.id === BLAST_PARTICLE), [{ id: BLAST_PARTICLE, at: blastAt, tick: blastTick }]);
  assert.deepEqual(r.w.played.filter((p) => p.tick > shotTick).map((p) => `${p.id}@${p.tick - shotTick}`), [`${UFO_SOUNDS.off}@1`, `${UFO_SOUNDS.blast}@${blastTick - shotTick}`]);
  assert.equal(e.isValid, false);
  assert.equal(e.removedTick, blastTick);

  // The reward exactly once, the broadcast to every online player naming the owner of the latching charge.
  assert.deepEqual(r.w.items, REWARD.map(({ typeId, amount }) => ({ typeId, amount, at: blastAt, tick: blastTick })));
  assert.deepEqual(REWARD, [
    { typeId: 'minecraft:diamond', amount: 8 },
    { typeId: 'minecraft:totem_of_undying', amount: 1 },
  ]);
  const message = { rawtext: [{ translate: SHOT_DOWN_TEXT, with: ['Alice'] }] };
  assert.deepEqual(r.inbox, { p1: [message], p2: [message] });
  assert.equal(SHOT_DOWN_TEXT, 'andrew.ufo.shot_down');

  // Gone with the blast: a later crossing finds no interceptor, and nothing more happens.
  assert.equal(r.interceptors.size, 0);
  r.tick(100);
  assert.equal(r.w.items.length, 2);
  assert.equal(r.inbox.p1.length, 1);
  assert.equal(r.data.get(NEXT_MS), shotNow + PAUSE_MS, 'the end of downed moved the schedule off the shot');
});

test('arrival and departure shots: no magnet-off sound, a moving hull is hit where it is, the 60-step cap blasts in mid-air, one reward', () => {
  for (const phase of ['arrival', 'departure']) {
    const D = { arrival: 200, magnet: 40, departure: 200, downed: 60 };
    const r = rig({ durations: D });
    // No ground at all: from the legs the fall cannot reach it, so the cap is what ends it.
    r.w.ground = -1000;
    r.core.command('come', 'p1');
    r.until(() => r.core.session()?.phase === phase && r.core.session().phaseTick === 90);
    const e = r.w.spawned[0];
    const S = r.saucer.saucerPosition();
    assert.ok(flatDist(S, HOVER) > 10, `${phase}: the saucer is ${flatDist(S, HOVER).toFixed(1)} out — not a moving-leg shot`);
    assert.equal(r.charge(HOVER.x, HOVER.z, S.y + 2, S.y + 1), false, `${phase}: the hover column was taken while the saucer is away`);
    const shotTick = r.w.tick;
    assert.equal(r.charge(Math.floor(S.x) + 0.5, Math.floor(S.z) + 0.5, S.y + 2, S.y + 1), true, `${phase}: the column under the saucer was not taken`);
    const rec = r.saucer.shot();
    assert.equal(rec.leg, phase);
    r.until(() => r.core.session() === undefined, 200);
    const shot = r.saucer.shot();
    const after = r.w.played.filter((p) => p.tick > shotTick).map((p) => p.id);
    assert.deepEqual(after, [UFO_SOUNDS.blast], `${phase}: sounds after the shot ${after.join(' ')}`);
    assert.equal(r.w.items.length, 2);
    const blast = r.w.items[0].at;
    let s = { y: S.y, vy: 0 };
    for (let i = 0; i < D.downed; i++) s = fallStep(s.y, s.vy);
    assert.ok(Math.abs(blast.y - s.y) < 1e-9, `${phase}: the cap blast is at y ${blast.y}, not ${s.y}`);
    assert.deepEqual([rec.blastBy, rec.steps], ['cap', D.downed]);
    assert.ok(flatDist(blast, S) < 1e-9, `${phase}: the blast is not under the shot position`);
    assert.equal(r.w.items[0].tick - shotTick, D.downed, `${phase}: the cap blast came after ${r.w.items[0].tick - shotTick} UFO ticks`);
    assert.equal(e.isValid, false);
    assert.equal(r.inbox.p1.length + r.inbox.p2.length, 2);
    assert.equal(r.core.lastEnd().reason, 'downed');
    assert.equal(shot, undefined, `${phase}: the shot record outlived the event`);
  }
});

test('the fall keeps absorbing (AS-sauc-5): a second crossing is taken with no second reward, broadcast or report', () => {
  const r = rig();
  r.core.command('come', 'p1');
  r.until(() => r.core.session()?.phase === 'magnet');
  assert.equal(r.charge(HOVER.x, HOVER.z, HOVER.y + 3.5, HOVER.y + 2.5), true);
  r.tick(10);
  const S = r.saucer.saucerPosition();
  assert.ok(S.y < HOVER.y, 'the saucer is not falling');
  const before = r.phases.length;
  assert.equal(r.charge(S.x, S.z, S.y + 1, S.y, { ownerId: 'p2', ownerName: 'Bob', attackId: 'gt-2-1' }), true, 'the falling hull let a charge through');
  assert.equal(r.saucer.shot().absorbed, 2);
  assert.equal(r.phases.length, before, 'a second crossing published a phase');
  r.until(() => r.core.session() === undefined, 200);
  assert.equal(r.w.items.length, 2);
  assert.deepEqual(r.inbox.p2.map((m) => m.rawtext[0].with), [['Alice']], 'the broadcast named the second shooter');
});

test('ufsd §3: an event that ends before the blast — a stop in the fall, a saucer gone mid-fall — still blasts once at the last position', () => {
  const r = rig();
  r.core.command('come', 'p1');
  r.until(() => r.core.session()?.phase === 'magnet');
  r.charge(HOVER.x, HOVER.z, HOVER.y + 3.5, HOVER.y + 2.5);
  r.tick(5);
  const S = { ...r.saucer.saucerPosition() };
  r.core.command('stop');
  r.until(() => r.core.session() === undefined, 5);
  assert.equal(r.core.lastEnd().reason, 'stop');
  assert.ok(Math.abs(r.w.items[0].at.y - S.y) < 0.2, 'the stop blast is not at the last position');
  assert.equal(r.w.items.length, 2);
  assert.equal(r.inbox.p1.length, 1);
  assert.equal(r.saucer.shot(), undefined);

  const q = rig();
  q.core.command('come', 'p1');
  q.until(() => q.core.session()?.phase === 'magnet');
  q.charge(HOVER.x, HOVER.z, HOVER.y + 3.5, HOVER.y + 2.5);
  q.tick(5);
  const last = { ...q.saucer.saucerPosition() };
  q.w.spawned[0].remove();
  q.tick();
  assert.deepEqual(q.w.items.map((i) => i.at), [last, last], 'an invalid saucer did not blast at its last position');
  assert.equal(q.core.session(), undefined, 'the event did not end with the blast');
  assert.equal(q.core.lastEnd().reason, 'downed');
});

test('no shoot-down host: nothing registers and nothing can shoot it; an outside report does not make it fall', () => {
  const r = rig({ shootdown: false });
  r.core.command('come', 'p1');
  r.until(() => r.core.session()?.phase === 'magnet');
  assert.equal(r.interceptors.size, 0);
  r.core.reportShotDown({ eventId: r.core.session().eventId, ownerId: 'p1', ownerName: 'Alice' });
  r.tick(30);
  assert.deepEqual(r.saucer.saucerPosition(), HOVER, 'the saucer fell without a shot of its own');
  assert.equal(r.saucer.shot(), undefined);
  r.until(() => r.core.session() === undefined, 200);
  assert.deepEqual([r.w.items.length, r.inbox.p1.length, r.w.particles.length], [0, 0, 0]);
});

test('lifecycle: registered at the spawn, gone after a departure and after a stop', () => {
  const D = { arrival: 10, magnet: 20, departure: 10, downed: 60 };
  const r = rig({ durations: D });
  assert.equal(r.interceptors.size, 0);
  r.core.command('come', 'p1');
  r.tick();
  assert.equal(r.interceptors.size, 1);
  r.until(() => r.core.session() === undefined);
  assert.equal(r.core.lastEnd().reason, 'departed');
  assert.equal(r.interceptors.size, 0);
  r.core.command('come', 'p1');
  r.tick(3);
  assert.equal(r.interceptors.size, 1);
  r.core.command('stop');
  r.until(() => r.core.session() === undefined, 5);
  assert.equal(r.interceptors.size, 0);
  assert.equal(r.w.items.length, 0, 'a departure or a stop without a shot gave a reward');
});

// ------------------------------------------------------------------ the product wiring (src/ufo/index.ts)

const product = await load("export { registerUfo } from './src/ufo/index.ts'; export { NEXT_MS } from './src/ufo/schedule.ts';", NO_ENGINE);

test('registerUfo: the product saucer registers its hull on the Cannon seam it is given, and a shot pays out through the engine objects', () => {
  const signal = () => {
    const handlers = [];
    return { handlers, subscribe: (cb) => (handlers.push(cb), cb), unsubscribe: (cb) => handlers.splice(handlers.indexOf(cb) >>> 0, 1) };
  };
  const afterEvents = { playerSpawn: signal(), entityLoad: signal(), entitySpawn: signal(), worldLoad: signal() };
  const intervals = new Map();
  let nextId = 1;
  const items = [];
  const said = [];
  const spawned = [];
  const overworld = {
    id: OW,
    heightRange: { min: -64, max: 320 },
    getEntities: () => [],
    spawnEntity(typeId, location) {
      const e = { id: `e${spawned.length}`, typeId, isValid: true, location: { ...location }, addTag() {}, setDynamicProperty() {}, setProperty() {}, teleport: (to) => (e.location = { ...to }), remove: () => (e.isValid = false) };
      spawned.push(e);
      return e;
    },
    getBlock: ({ y }) => ({ isAir: y > CENTRE.y }),
    spawnParticle() {},
    playSound() {},
    spawnItem: (stack, at) => items.push({ stack, at: { ...at } }),
  };
  const player = {
    id: 'p1',
    name: 'Alice',
    isValid: true,
    location: at(CENTRE.x + 0.5, CENTRE.y + 1, CENTRE.z + 0.5),
    dimension: { id: OW },
    getComponent: () => ({ currentValue: 20 }),
    sendMessage: (m) => said.push(m),
  };
  const props = new Map();
  class ItemStack {
    constructor(typeId, amount) {
      this.typeId = typeId;
      this.amount = amount;
    }
  }
  const hulls = new Set();
  const engine = {
    world: {
      afterEvents,
      getAllPlayers: () => [undefined, player],
      getDimension: () => overworld,
      getDynamicProperty: (k) => props.get(k),
      setDynamicProperty: (k, v) => (v === undefined ? props.delete(k) : props.set(k, v)),
    },
    system: {
      beforeEvents: { startup: { subscribe() {} } },
      runInterval: (cb) => (intervals.set(nextId, cb), nextId++),
      clearRun: (id) => intervals.delete(id),
    },
    CommandPermissionLevel: { GameDirectors: 1 },
    CustomCommandParamType: { Enum: 'Enum' },
    CustomCommandStatus: { Success: 0, Failure: 1 },
    ItemStack,
    BlockVolume: class {},
    registerInterceptor: (fn) => (hulls.add(fn), () => hulls.delete(fn)),
  };
  const core = product.registerUfo(engine, 'pw');
  for (const cb of afterEvents.worldLoad.handlers) cb({});
  const tickAll = (n = 1) => {
    for (let i = 0; i < n; i++) for (const cb of [...intervals.values()]) cb();
  };
  assert.equal(core.command('come', 'p1').ok, true);
  tickAll(2);
  assert.equal(core.session()?.phase, 'arrival');
  assert.equal(hulls.size, 1, 'the product saucer did not register its hull on the seam it was given');
  const S = spawned[0].location;
  const attack = { attackId: 'oc-1-1', mode: 'lmb', ownerId: 'p1', dimensionId: OW, charges: [] };
  const taken = [...hulls][0](attack, { slot: 0, x: Math.floor(S.x), z: Math.floor(S.z) }, at(S.x, S.y + 2, S.z), at(S.x, S.y + 1, S.z), 1);
  assert.equal(taken, true);
  assert.equal(core.session()?.phase, 'downed');
  tickAll(61);
  assert.equal(core.session(), undefined);
  assert.equal(core.lastEnd().reason, 'downed');
  assert.deepEqual(items.map((i) => [i.stack instanceof ItemStack, i.stack.typeId, i.stack.amount]), [
    [true, 'minecraft:diamond', 8],
    [true, 'minecraft:totem_of_undying', 1],
  ]);
  const shotDown = said.filter((m) => m.rawtext?.[0]?.translate === SHOT_DOWN_TEXT);
  assert.deepEqual(shotDown, [{ rawtext: [{ translate: SHOT_DOWN_TEXT, with: ['Alice'] }] }], 'the broadcast skipped the player or misnamed the shooter');
  assert.equal(hulls.size, 0, 'the hull outlived the blast');
  assert.equal(typeof props.get(product.NEXT_MS), 'number');
});
