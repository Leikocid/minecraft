// The UFO saucer (src/ufo/saucer.ts, L0-sauc) over fakes: the §2 path and its
// step bound, the beam property and the sounds against the real core's phase
// clock, and the entity's two packs read as files — the BP shape of R-sauc-3
// and the RP model, beam bone and animations of L0-sauc-ent1. The engine half
// is src/gametest/ufo-saucer.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function load() {
  const bundle = await build({
    stdin: {
      contents: `
        export * from './src/ufo/saucer.ts';
        export { UfoCore, SAUCER_ID, UFO_TAG, EVENT_TAG, horizontalDistance } from './src/ufo/event.ts';
        export { PHASE_TICKS, PAUSE_MS, FIRST_MIN_MS, FIRST_MAX_MS } from './src/ufo/env.ts';
        export { HULL_RADIUS, HULL_HEIGHT } from './src/ufo/shootdown.ts';`,
      resolveDir: projectRoot,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    external: ['@minecraft/server'],
    write: false,
  });
  const src = bundle.outputFiles[0].text + `\n// ${Math.random()}`;
  return import('data:text/javascript;base64,' + Buffer.from(src, 'utf-8').toString('base64'));
}

const m = await load();
const {
  APPROACH_DISTANCE,
  ARRIVAL_BEARINGS,
  BEAM_LEN_MAX,
  BEAM_LEN_PROPERTY,
  BEAM_PROPERTY,
  EVENT_PROPERTY,
  HOVER_DRIFT,
  HUM_TICKS,
  SOUND_VOLUME,
  REACH_MARGIN,
  UFO_SOUNDS,
  arrivalBearing,
  beamLength,
  createSaucer,
  departEase,
  flightPath,
  legHeight,
  legPosition,
  smoothstep,
  tickingReach,
  UfoCore,
  SAUCER_ID,
  UFO_TAG,
  EVENT_TAG,
  horizontalDistance,
  PHASE_TICKS,
  PAUSE_MS,
  FIRST_MIN_MS,
  FIRST_MAX_MS,
  HULL_RADIUS,
  HULL_HEIGHT,
} = m;

const readJson = (rel) => JSON.parse(readFileSync(join(projectRoot, rel), 'utf-8'));
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const CENTRE = { x: 10, y: -61, z: -7 };
const HOVER_Y = CENTRE.y + 40;

/** Every position the saucer takes in one event, in UFO ticks from the spawn tick: the core's own stepping. */
function trajectory(path, D) {
  const out = [{ leg: 'spawn', t: 0, at: path.start }];
  for (let t = 1; t < D.arrival; t++) out.push({ leg: 'arrival', t, at: legPosition(path, 'arrival', t, D) });
  for (let t = 1; t <= D.magnet; t++) out.push({ leg: 'hover', t, at: path.hover });
  for (let t = 1; t <= D.departure; t++) out.push({ leg: 'departure', t, at: legPosition(path, 'departure', t, D) });
  return out;
}

// ------------------------------------------------------------ the path (R-sauc-2)

test('path: in from 90 out at hover + 10, at the hover point at arrival + 400, out 90 the opposite way', () => {
  for (const theta of [0, 0.37, Math.PI / 2, 2.2, Math.PI, 4.1, 5.9]) {
    const p = flightPath(CENTRE, HOVER_Y, 320, theta);
    const mid = { x: CENTRE.x + 0.5, y: HOVER_Y, z: CENTRE.z + 0.5 };
    assert.ok(Math.abs(flat(p.start, mid) - APPROACH_DISTANCE) < 1e-9, `θ ${theta}: spawn ${flat(p.start, mid)} out`);
    assert.equal(p.start.y, HOVER_Y + 10);
    assert.deepEqual(p.hover, mid);
    assert.ok(dist(legPosition(p, 'arrival', PHASE_TICKS.arrival, PHASE_TICKS), mid) < 1e-9, 'the arrival does not end on the hover point');
    const end = legPosition(p, 'departure', PHASE_TICKS.departure, PHASE_TICKS);
    assert.ok(dist(end, p.end) < 1e-9 && Math.abs(flat(end, mid) - APPROACH_DISTANCE) < 1e-9 && end.y === HOVER_Y + 10, `θ ${theta}: the departure ends at ${JSON.stringify(end)}`);
    const bin = { x: (p.start.x - mid.x) / 90, z: (p.start.z - mid.z) / 90 };
    const bout = { x: (end.x - mid.x) / 90, z: (end.z - mid.z) / 90 };
    assert.ok(bin.x * bout.x + bin.z * bout.z < -0.9999, `θ ${theta}: the departure bearing is not opposite the arrival`);
  }
});

test('path: no step over 0.5 blocks and never past 90 horizontal, at the real phase lengths', () => {
  for (let i = 0; i < 64; i++) {
    const p = flightPath(CENTRE, HOVER_Y, 320, (i / 64) * 2 * Math.PI);
    const mid = p.hover;
    const tr = trajectory(p, PHASE_TICKS);
    let maxStep = 0;
    for (let k = 1; k < tr.length; k++) maxStep = Math.max(maxStep, dist(tr[k].at, tr[k - 1].at));
    const far = Math.max(...tr.map((s) => flat(s.at, mid)));
    assert.ok(maxStep <= 0.5, `step ${maxStep.toFixed(3)} blocks`);
    assert.ok(far <= APPROACH_DISTANCE + 1e-9, `${far} blocks out`);
  }
});

test('easing: arrival smoothstep, departure accelerates from rest and cruises, both monotonic and exact at the ends', () => {
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(1), 1);
  assert.equal(departEase(0), 0);
  assert.ok(Math.abs(departEase(1) - 1) < 1e-12);
  let prevStep = 0;
  for (let t = 1; t <= 300; t++) {
    const step = departEase(t / 300) - departEase((t - 1) / 300);
    assert.ok(step >= prevStep - 1e-12, `the departure slows down at t ${t}`);
    assert.ok(step * 300 <= 1.5 + 1e-9, `the departure runs faster than 1.5× its mean at t ${t}`);
    prevStep = step;
  }
  assert.ok(departEase(1 / 300) * 90 < 0.01, 'the departure jumps off the hover point');
});

test('legHeight caps the legs at ceiling − 4; beamLength is hoverY − centre.y within the BP range', () => {
  assert.equal(legHeight(305, 320), 315);
  assert.equal(legHeight(310, 320), 316);
  assert.equal(beamLength(CENTRE, HOVER_Y), 40);
  assert.equal(beamLength({ x: 0, y: 290, z: 0 }, 305), 15);
  assert.equal(beamLength({ x: 0, y: 0, z: 0 }, 99), BEAM_LEN_MAX);
});

// ------------------------------------------------------------ the saucer on the core's clock

/** Like the engine: an entity is spawned and moved only into a chunk that is loaded and ticking. */
function fakeEngine(ticking = () => true) {
  const engine = { spawned: [], played: [], tick: 0 };
  const refuse = (at) => {
    if (!ticking(at)) throw new Error(`LocationInUnloadedChunkError: Trying to access location (${at.x}, ${at.y}, ${at.z}) which is not in a chunk currently loaded and ticking.`);
  };
  engine.overworld = {
    isChunkLoaded: (at) => ticking(at),
    spawnEntity(typeId, at) {
      refuse(at);
      const e = { id: `e${engine.spawned.length}`, typeId, isValid: true, removed: false, location: { ...at }, tags: [], dp: {}, props: {}, pending: [], writes: [], teleports: 0 };
      e.addTag = (t) => e.tags.push(t);
      e.setDynamicProperty = (k, v) => (e.dp[k] = v);
      // Like the engine: "this property change is not applied until the next tick".
      e.setProperty = (k, v) => {
        e.pending.push([k, v]);
        e.writes.push({ k, v, tick: engine.tick });
      };
      e.teleport = (to) => {
        refuse(to);
        e.teleports++;
        e.location = { ...to };
      };
      e.remove = () => {
        e.removed = true;
        e.isValid = false;
      };
      engine.spawned.push(e);
      return e;
    },
    playSound: (id, at, opts) => engine.played.push({ id, at: { ...at }, opts }),
  };
  return engine;
}

function rig({ durations = PHASE_TICKS, theta01 = 0.25, spy = true, ticking = undefined } = {}) {
  const engine = fakeEngine(ticking);
  const r = { engine, ticks: 0, sounds: [], samples: [], logs: [] };
  const target = { id: 'a', name: 'a', location: { x: CENTRE.x + 0.5, y: CENTRE.y + 1, z: CENTRE.z + 0.5 }, sendMessage() {} };
  const data = new Map();
  let now = 1_790_000_000_000;
  const env = {
    now: () => now,
    durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: () => [target],
    random: () => 0,
    store: { get: (k) => data.get(k), set: (k, v) => (v === undefined ? data.delete(k) : data.set(k, v)) },
    ceiling: () => 320,
    log: (msg) => r.logs.push(msg),
  };
  r.saucer = createSaucer({
    overworld: () => engine.overworld,
    random: () => theta01,
    durations,
    ceiling: env.ceiling,
    log: env.log,
    ...(spy ? { sound: (id, at) => r.sounds.push({ id, at: { ...at }, tick: r.ticks, phase: r.core.session()?.phase }) } : {}),
  });
  r.phases = [];
  r.core = new UfoCore(env, { scope: 'us', saucer: r.saucer, listeners: [{ onPhase: (phase) => r.phases.push({ phase, tick: r.ticks }) }] });
  r.tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      now += 50;
      r.ticks++;
      engine.tick = r.ticks;
      for (const e of engine.spawned) for (const [k, v] of e.pending.splice(0)) if (e.isValid) e.props[k] = v;
      r.core.tick();
      const e = engine.spawned.at(-1);
      r.samples.push({ tick: r.ticks, phase: r.core.session()?.phase, beam: e?.isValid ? e.props[BEAM_PROPERTY] === true : undefined, at: e?.isValid ? { ...e.location } : undefined });
    }
  };
  r.until = (cond, max = 10_000) => {
    for (let i = 0; i < max; i++) {
      r.tick();
      if (cond()) return;
    }
    throw new Error('condition never held');
  };
  r.at = (phase) => r.phases.find((p) => p.phase === phase)?.tick;
  return r;
}

test('saucer through a whole event: one entity, tagged, the path, beam on exactly in the magnet, the sound log, removed at pause', () => {
  const r = rig();
  r.core.command('come', 'a');
  r.until(() => r.core.session() === undefined && r.at('pause') !== undefined);
  const { spawned } = r.engine;
  assert.equal(spawned.length, 1);
  const e = spawned[0];
  const arrival = r.at('arrival');
  const magnet = r.at('magnet');
  const release = r.at('release');
  const pause = r.at('pause');
  assert.equal(e.typeId, SAUCER_ID);
  assert.ok(e.tags.includes(UFO_TAG) && e.tags.some((t) => t.startsWith(EVENT_TAG)));
  assert.equal(typeof e.dp[EVENT_PROPERTY], 'string');
  assert.equal(e.props[BEAM_LEN_PROPERTY], 40, 'beam_len is not hoverY − centre.y');
  assert.equal(magnet - arrival, PHASE_TICKS.arrival);
  assert.equal(release - magnet, PHASE_TICKS.magnet);
  assert.equal(pause - release, PHASE_TICKS.departure);

  const centre = { x: CENTRE.x, y: CENTRE.y, z: CENTRE.z };
  const spawn = r.samples.find((s) => s.tick === arrival);
  assert.ok(Math.abs(horizontalDistance(centre, spawn.at) - 90) < 1e-9 && spawn.at.y === HOVER_Y + 10, `spawned at ${JSON.stringify(spawn.at)}`);
  const hover = { x: CENTRE.x + 0.5, y: HOVER_Y, z: CENTRE.z + 0.5 };
  for (const s of r.samples.filter((s) => s.tick >= magnet && s.tick < release)) assert.ok(dist(s.at, hover) < 1e-9, `off the hover point at tick ${s.tick}`);
  const last = r.samples.find((s) => s.tick === pause - 1);
  assert.ok(Math.abs(horizontalDistance(centre, last.at) - 90) < 1e-9, `last position ${horizontalDistance(centre, last.at)} out`);
  assert.equal(r.samples.find((s) => s.tick === pause).at, undefined, 'the saucer outlived the pause tick');
  assert.equal(e.removed, true);

  // R-sauc-5: false through the arrival, true from magnet-on to the last magnet tick, false from the release.
  const wrong = r.samples.filter((s) => s.at !== undefined && s.beam !== (s.tick >= magnet && s.tick < release));
  assert.deepEqual(wrong.map((s) => `${s.tick}:${s.phase}:${s.beam}`), []);

  // R-sauc-6: activate at magnet-on, a hum every 40 from +40, deactivate at the release, nothing after.
  const hums = Array.from({ length: Math.ceil(PHASE_TICKS.magnet / HUM_TICKS) - 1 }, (_, k) => ({ id: UFO_SOUNDS.hum, tick: magnet + HUM_TICKS * (k + 1) }));
  const expected = [{ id: UFO_SOUNDS.on, tick: magnet }, ...hums, { id: UFO_SOUNDS.off, tick: release }];
  assert.equal(PHASE_TICKS.magnet, 600);
  assert.equal(hums.length, 14);
  assert.equal(UFO_SOUNDS.hum, 'andrew.ufo.hum');
  assert.deepEqual(r.sounds.map(({ id, tick }) => ({ id, tick })), expected);
  assert.ok(r.sounds.every((s) => dist(s.at, hover) < 1e-9), 'a UFO sound away from the saucer');
  r.tick(100);
  assert.equal(r.sounds.length, expected.length, 'a UFO sound after the removal');
});

test('stop in the magnet: beam off and one deactivate in the release tick, removed in the same tick; stop in the arrival: silent', () => {
  const D = { arrival: 20, magnet: 200, departure: 20, downed: 10 };
  const r = rig({ durations: D });
  r.core.command('come', 'a');
  r.until(() => r.core.session()?.phase === 'magnet');
  r.tick(50);
  const e = r.engine.spawned[0];
  assert.equal(e.props[BEAM_PROPERTY], true);
  r.core.command('stop');
  r.until(() => r.core.session() === undefined);
  const release = r.at('release');
  assert.equal(release, r.at('pause'));
  assert.deepEqual(e.writes.filter((w) => w.k === BEAM_PROPERTY).at(-1), { k: BEAM_PROPERTY, v: false, tick: release }, 'the stop did not write the beam off in its own tick');
  assert.deepEqual(r.sounds.filter((s) => s.id === UFO_SOUNDS.off).map((s) => s.tick), [release]);
  assert.equal(e.removed, true);

  const q = rig({ durations: D });
  q.core.command('come', 'a');
  q.until(() => q.core.session()?.phase === 'arrival');
  q.tick(5);
  q.core.command('stop');
  q.until(() => q.core.session() === undefined);
  assert.deepEqual(q.sounds, [], 'a stop in the arrival played a sound');
  assert.equal(q.engine.spawned[0].props[BEAM_PROPERTY], undefined, 'a stop in the arrival touched the beam');
  assert.equal(q.engine.spawned[0].removed, true);
});

test('beam writes: one tick ahead of the scheduled magnet-on and release; a shot in the step that wrote it ahead takes it back silently', () => {
  const D = { arrival: 10, magnet: 50, departure: 10, downed: 5 };
  const r = rig({ durations: D });
  r.core.command('come', 'a');
  r.until(() => r.at('pause') !== undefined);
  const writes = r.engine.spawned[0].writes.filter((w) => w.k === BEAM_PROPERTY).map(({ v, tick }) => ({ v, tick }));
  assert.deepEqual(writes, [
    { v: true, tick: r.at('magnet') - 1 },
    { v: false, tick: r.at('release') - 1 },
  ]);

  const q = rig({ durations: D });
  q.core.command('come', 'a');
  q.until(() => q.core.session()?.phase === 'arrival' && q.core.session().phaseTick === D.arrival - 1);
  const e = q.engine.spawned[0];
  assert.equal(e.pending.at(-1)?.[1], true, 'the last arrival step did not write the beam ahead');
  q.core.reportShotDown({ eventId: q.core.session().eventId, ownerId: 'a', ownerName: 'a' });
  q.until(() => q.core.session() === undefined);
  const lit = q.samples.filter((s) => s.at !== undefined && s.beam === true);
  assert.deepEqual(lit.map((s) => `${s.tick}:${s.phase}`), [], 'the beam showed after a shot that came before the magnet');
  assert.deepEqual(q.sounds, [], 'a shot before the magnet played a UFO sound');
});

test('the hover re-teleports only when the entity drifts past HOVER_DRIFT; without a spy the sounds go to the overworld at volume 4', () => {
  const D = { arrival: 10, magnet: 100, departure: 10, downed: 10 };
  const r = rig({ durations: D, spy: false });
  r.core.command('come', 'a');
  r.until(() => r.core.session()?.phase === 'magnet');
  r.tick(2);
  const e = r.engine.spawned[0];
  const before = e.teleports;
  const hover = r.saucer.legs().hover;
  e.location = { ...hover, x: hover.x + HOVER_DRIFT / 2 };
  r.tick();
  assert.equal(e.teleports, before, 'a drift under HOVER_DRIFT was corrected');
  e.location = { ...hover, x: hover.x + 0.5 };
  r.tick();
  assert.equal(e.teleports, before + 1);
  assert.ok(dist(e.location, hover) < 1e-9);
  assert.deepEqual(r.saucer.saucerPosition(), hover);
  assert.deepEqual(r.engine.played[0], { id: UFO_SOUNDS.on, at: hover, opts: { volume: SOUND_VOLUME } });
});

// ------------------------------------------------------------ the measured reach (one player's ticking disc)

/** As measured on BDS 1.26.51.1 at tick-distance 4 (ufo_arrival_reach_measured): the chunks with dx² + dz² ≤ 17 around the player's. */
const disc = (at) => {
  const [pcx, pcz] = [Math.floor(at.x / 16), Math.floor(at.z / 16)];
  return (q) => (Math.floor(q.x / 16) - pcx) ** 2 + (Math.floor(q.z / 16) - pcz) ** 2 <= 17;
};

/** Brute force: the last 0.05-block sample along the bearing whose chunk ticks. */
function walked(ticking, from, theta, max) {
  let reach = 0;
  for (let d = 0; d <= max + 1e-9; d += 0.05) {
    if (!ticking({ x: from.x + d * Math.cos(theta), y: from.y, z: from.z + d * Math.sin(theta) })) break;
    reach = d;
  }
  return reach;
}

test('tickingReach: the whole leg where every chunk ticks, 0 where the first one does not, the column edge less the margin on an axis', () => {
  const from = { x: 8.5, y: 0, z: 8.5 };
  for (const theta of [0, 1, Math.PI / 4, Math.PI, 4]) assert.equal(tickingReach(() => true, from, theta, APPROACH_DISTANCE), APPROACH_DISTANCE);
  assert.equal(tickingReach(() => false, from, 0, APPROACH_DISTANCE), 0);
  // Columns 0…4 tick along +x: the first refused column starts at x 80, 71.5 out.
  const row = (q) => Math.floor(q.x / 16) <= 4;
  assert.equal(tickingReach(row, from, 0, APPROACH_DISTANCE), 80 - from.x - REACH_MARGIN);
  assert.equal(tickingReach(row, from, Math.PI, APPROACH_DISTANCE), APPROACH_DISTANCE);
});

test('tickingReach over the measured disc: never past its edge, at most the margin short, 44+ blocks from any spot and bearing', () => {
  let lo = Infinity;
  let hi = 0;
  for (const [ox, oz] of [[8.5, 8.5], [0.5, 0.5], [15.5, 15.5], [3.25, 12.75]]) {
    const from = { x: 160 + ox, y: 100, z: -320 + oz };
    const ticking = disc(from);
    for (let k = 0; k < 360; k++) {
      const theta = (k * Math.PI) / 180;
      const reach = tickingReach(ticking, from, theta, APPROACH_DISTANCE);
      const brute = walked(ticking, from, theta, APPROACH_DISTANCE);
      for (let d = 0; d <= reach; d += 0.05) assert.ok(ticking({ x: from.x + d * Math.cos(theta), y: 0, z: from.z + d * Math.sin(theta) }), `${k}° from ${ox},${oz}: ${d} of ${reach} is outside`);
      assert.ok(reach >= brute - REACH_MARGIN - 0.05 - 1e-9 && reach <= brute + 1e-9, `${k}° from ${ox},${oz}: reach ${reach}, walked ${brute}`);
      lo = Math.min(lo, reach);
      hi = Math.max(hi, reach);
    }
  }
  assert.ok(lo >= 44 && hi < APPROACH_DISTANCE, `reach over the disc ${lo}…${hi}`);
});

test('arrivalBearing: the random bearing when it reaches 90; else the longest of ARRIVAL_BEARINGS around it, the earliest on a tie', () => {
  const from = { x: 8.5, y: 0, z: 8.5 };
  const seen = [];
  const all = (q) => (seen.push(q), true);
  assert.deepEqual(arrivalBearing(all, from, 2), { theta: 2, reach: APPROACH_DISTANCE });
  const asked = seen.length;
  assert.ok(asked <= 8, `${asked} columns asked for one full-length bearing`);
  // Only −z ticks far: of eight bearings from 0, the one at 3π/2 wins.
  const south = (q) => Math.floor(q.x / 16) === 0 && Math.floor(q.z / 16) <= 0;
  const best = arrivalBearing(south, from, 0);
  assert.ok(Math.abs(best.theta - (3 * Math.PI) / 2) < 1e-9 && best.reach === APPROACH_DISTANCE, JSON.stringify(best));
  // One column, from its middle: the four diagonals tie at 8√2 − margin; the first of them wins.
  const tie = arrivalBearing((q) => Math.floor(q.x / 16) === 0 && Math.floor(q.z / 16) === 0, { x: 8, y: 0, z: 8 }, 0);
  assert.ok(Math.abs(tie.theta - Math.PI / 4) < 1e-12 && Math.abs(tie.reach - (8 * Math.SQRT2 - REACH_MARGIN)) < 1e-9, JSON.stringify(tie));
  assert.equal(ARRIVAL_BEARINGS, 8);
});

test("the saucer over one player's disc: spawned at the measured reach, every step and the departure inside, both legs logged", () => {
  const hover = { x: CENTRE.x + 0.5, z: CENTRE.z + 0.5 };
  const ticking = disc(hover);
  for (const theta01 of [0, 0.125, 0.3, 0.77]) {
    const r = rig({ ticking, theta01 });
    r.core.command('come', 'a');
    r.until(() => r.core.session() === undefined && r.at('pause') !== undefined);
    assert.equal(r.core.lastEnd().reason, 'departed', `θ ${theta01}: ended ${r.core.lastEnd().reason}; ${r.logs.join(' | ')}`);
    const steps = r.samples.filter((x) => x.at !== undefined);
    assert.ok(steps.every((x) => ticking(x.at)), `θ ${theta01}: a step outside the disc`);
    const path = r.saucer.legs?.() ?? undefined;
    assert.equal(path, undefined);
    const spawn = r.samples.find((x) => x.tick === r.at('arrival')).at;
    const out0 = horizontalDistance(CENTRE, spawn);
    const last = steps.at(-1).at;
    const out1 = horizontalDistance(CENTRE, last);
    assert.ok(out0 >= 44 && out0 < APPROACH_DISTANCE && out1 >= 44 && out1 < APPROACH_DISTANCE, `θ ${theta01}: in from ${out0}, out to ${out1}`);
    assert.ok(ticking(spawn) && spawn.y === HOVER_Y + 10);
    const theta = Math.atan2(spawn.z - hover.z, spawn.x - hover.x);
    const back = Math.atan2(last.z - hover.z, last.x - hover.x);
    assert.ok(Math.abs(Math.cos(theta - back) + 1) < 1e-9, `θ ${theta01}: the departure is not opposite the arrival`);
    assert.ok(r.logs.some((l) => l.includes(`saucer in from ${out0.toFixed(2)} blocks`)), r.logs.join(' | '));
    assert.ok(r.logs.some((l) => l.includes(`saucer out to ${out1.toFixed(2)} blocks`)), r.logs.join(' | '));
  }
});

test('the nominal 90-block start over the same disc throws, as on the live server', () => {
  const ticking = disc({ x: CENTRE.x + 0.5, z: CENTRE.z + 0.5 });
  for (let k = 0; k < 64; k++) {
    const p = flightPath(CENTRE, HOVER_Y, 320, (k / 64) * 2 * Math.PI);
    assert.equal(ticking(p.start), false, `the disc holds ${JSON.stringify(p.start)}, 90 out`);
  }
});

// ------------------------------------------------------------ the packs (R-sauc-3, L0-sauc-ent1)

test('BP: the R-sauc-3 shape — snowball runtime, format 1.26.0, no box, no physics, unpushable, immune, two client-synced properties', () => {
  const bp = readJson('packs/behavior/entities/ufo_saucer.json');
  assert.equal(bp.format_version, '1.26.0', 'the 1.26.50 format refuses minecraft:pushable and the whole entity with it');
  const d = bp['minecraft:entity'].description;
  const c = bp['minecraft:entity'].components;
  assert.equal(d.identifier, SAUCER_ID);
  assert.equal(d.runtime_identifier, 'minecraft:snowball', 'without a runtime a custom entity pushes mobs');
  assert.equal(d.is_spawnable, false);
  assert.deepEqual(c['minecraft:collision_box'], { width: 0, height: 0 });
  assert.deepEqual(c['minecraft:physics'], { has_gravity: false, has_collision: false });
  assert.deepEqual(c['minecraft:pushable'], { is_pushable: false, is_pushable_by_piston: false });
  assert.equal(c['minecraft:knockback_resistance'].value, 1);
  assert.deepEqual(c['minecraft:damage_sensor'], { triggers: { cause: 'all', deals_damage: 'no' } });
  assert.ok(c['minecraft:type_family'].family.includes('andrew_ufo'));
  for (const absent of ['minecraft:health', 'minecraft:projectile']) assert.equal(c[absent], undefined, `${absent} is on the saucer`);
  assert.deepEqual(d.properties[BEAM_PROPERTY], { type: 'bool', default: false, client_sync: true });
  assert.deepEqual(d.properties[BEAM_LEN_PROPERTY], { type: 'int', range: [0, BEAM_LEN_MAX], default: 40, client_sync: true });
});

const PX = 16;

/** Corners of a cube after its Y rotation about its pivot, in pixels. */
function corners(cube) {
  const [x0, y0, z0] = cube.origin;
  const [sx, sy, sz] = cube.size;
  const a = ((cube.rotation?.[1] ?? 0) * Math.PI) / 180;
  const [px, , pz] = cube.pivot ?? [0, 0, 0];
  const out = [];
  for (const x of [x0, x0 + sx])
    for (const z of [z0, z0 + sz])
      for (const y of [y0, y0 + sy]) {
        const dx = x - px;
        const dz = z - pz;
        out.push({ x: px + dx * Math.cos(a) - dz * Math.sin(a), y, z: pz + dx * Math.sin(a) + dz * Math.cos(a) });
      }
  return out;
}

const SLICES = Array.from({ length: 40 }, (_, i) => `beam_${String(i).padStart(2, '0')}`);

test('RP: one geometry fills the hull band [y, y + 6] within r 12, the beam is 40 one-block slices under the beam bone down to a 5-block radius, the bounds hold both', () => {
  assert.deepEqual([HULL_RADIUS, HULL_HEIGHT], [12, 6], 'the model and the hit cylinder disagree');
  const geo = readJson('packs/resource/models/entity/ufo_saucer.geo.json')['minecraft:geometry'];
  assert.equal(geo.length, 1);
  const g = geo[0];
  assert.equal(g.description.identifier, 'geometry.andrew.ufo_saucer');
  const bones = new Map(g.bones.map((b) => [b.name, b]));
  for (const name of ['disc', 'rim', 'dome', 'rim_lights', 'beam', ...SLICES]) assert.ok(bones.has(name), `no ${name} bone`);
  for (const name of ['disc', 'rim', 'dome', 'rim_lights']) {
    const pts = bones.get(name).cubes.flatMap(corners);
    assert.ok(pts.every((p) => p.y >= 0 && p.y <= HULL_HEIGHT * PX), `${name} leaves the hull band`);
    const r = Math.max(...pts.map((p) => Math.hypot(p.x, p.z)));
    assert.ok(r <= HULL_RADIUS * PX + 1e-9, `${name} reaches ${(r / PX).toFixed(2)} blocks out`);
  }
  const all = ['disc', 'rim', 'dome'].flatMap((n) => bones.get(n).cubes.flatMap(corners));
  assert.ok(Math.min(...all.map((p) => p.y)) === 0 && Math.max(...all.map((p) => p.y)) === HULL_HEIGHT * PX, 'the disc and dome do not span the band');
  assert.ok(Math.max(...bones.get('rim').cubes.flatMap(corners).map((p) => Math.hypot(p.x, p.z))) >= 11 * PX, 'the disc is not ~24 blocks across');
  assert.equal(bones.get('rim_lights').cubes.length >= 12 && bones.get('rim_lights').cubes.length <= 16, true);

  // The beam bone draws nothing itself: it is the parent the beam_length animation scales.
  assert.equal(bones.get('beam').cubes?.length ?? 0, 0, 'the beam bone has cubes of its own');
  const slices = g.bones.filter((b) => b.name.startsWith('beam_'));
  assert.deepEqual(slices.map((b) => b.name), SLICES, 'the beam is not beam_00 … beam_39 in order');
  for (const b of slices) {
    assert.equal(b.parent, 'beam', `${b.name} does not hang from the beam bone`);
    assert.equal(b.cubes.length, 1, `${b.name} is not one cube`);
  }
  const box = slices.map((b) => {
    const pts = corners(b.cubes[0]);
    const ys = pts.map((p) => p.y);
    return { top: Math.max(...ys), bottom: Math.min(...ys), r: Math.max(...pts.map((p) => Math.max(Math.abs(p.x), Math.abs(p.z)))) };
  });
  assert.ok(box[0].top <= 0, 'the beam reaches into the disc');
  box.forEach((b, i) => {
    assert.equal(b.top - b.bottom, PX, `${SLICES[i]} is not one block high`);
    if (i > 0) {
      assert.equal(b.top, box[i - 1].bottom, `${SLICES[i]} does not start where ${SLICES[i - 1]} ends: the slices are not top first and gapless`);
      assert.ok(b.r >= box[i - 1].r, `${SLICES[i]} is narrower than the slice above it`);
    }
  });
  assert.equal(Math.round((box[0].top - box[39].bottom) / PX), 40, 'the beam is not 40 blocks long at beam_len 40');
  assert.equal(box[39].r / PX, 5, 'the beam does not end at a 5-block radius');
  assert.ok(box[0].r < box[39].r / 4, 'the beam is not a cone');

  const { visible_bounds_width: w, visible_bounds_height: h, visible_bounds_offset: off } = g.description;
  assert.ok(w >= 2 * HULL_RADIUS, `bounds ${w} wide`);
  assert.ok(off[1] - h / 2 <= -BEAM_LEN_MAX && off[1] + h / 2 >= HULL_HEIGHT, `bounds span ${off[1] - h / 2} … ${off[1] + h / 2}`);
});

const BEAM_ON = "q.property('andrew:beam')";
const BANDS = { beam_bright: [0], beam_mid: [1, 3], beam_dim: [2] };
const beamController = (band) => `controller.render.andrew.ufo_saucer.${band}`;

/** A part_visibility condition as a JS function of (beam, life_time); only the Molang the beam controllers use is accepted. */
function molang(cond) {
  const js = cond
    .replaceAll(BEAM_ON, 'beam')
    .replaceAll('math.mod(', 'mod(')
    .replaceAll('math.floor(', 'Math.floor(')
    .replaceAll('q.life_time', 't');
  assert.match(js.replaceAll('Math.floor', ''), /^[a-z0-9\s()+*=|&,]+$/, `unexpected Molang in ${cond}`);
  return new Function('beam', 't', 'const mod = (a, b) => a % b; return !!(' + js + ');');
}

test('RP: the client entity resolves its geometry, controllers and animations; the beam slices band by q.property and q.life_time and scale by beam_len', () => {
  const client = readJson('packs/resource/entity/ufo_saucer.entity.json')['minecraft:client_entity'].description;
  assert.equal(client.identifier, SAUCER_ID);
  const geo = readJson('packs/resource/models/entity/ufo_saucer.geo.json')['minecraft:geometry'][0];
  const bones = new Set(geo.bones.map((b) => b.name));
  const drawable = geo.bones.filter((b) => (b.cubes?.length ?? 0) > 0).map((b) => b.name);
  assert.deepEqual(Object.values(client.geometry), ['geometry.andrew.ufo_saucer']);

  const controllers = readJson('packs/resource/render_controllers/ufo_saucer.render_controllers.json').render_controllers;
  const shown = new Map();
  for (const id of client.render_controllers) {
    const rc = controllers[id];
    assert.ok(rc, `${id} is not defined`);
    assert.equal(rc.geometry, 'Geometry.default');
    for (const t of rc.textures) assert.ok(client.textures[t.replace(/^Texture\./, '')], `${id}: ${t} is not a client texture`);
    for (const mat of rc.materials) for (const v of Object.values(mat)) assert.ok(client.materials[v.replace(/^Material\./, '')], `${id}: ${v} is not a client material`);
    const vis = rc.part_visibility;
    assert.deepEqual(vis[0], { '*': false }, `${id} does not start from nothing shown`);
    for (const entry of vis.slice(1))
      for (const [bone, cond] of Object.entries(entry)) {
        assert.ok(bones.has(bone), `${id} shows a bone ${bone} the geometry lacks`);
        if (!shown.has(bone)) shown.set(bone, []);
        shown.get(bone).push({ id, cond, material: client.materials[Object.values(rc.materials[0])[0].replace(/^Material\./, '')] });
      }
  }
  for (const bone of drawable) assert.ok(shown.has(bone), `${bone} has cubes and no controller draws it`);
  const beamIds = Object.keys(BANDS).map(beamController);
  for (const [bone, by] of shown) {
    if (bone === 'beam' || SLICES.includes(bone)) {
      assert.deepEqual(by.map((x) => x.id).sort(), [...beamIds].sort(), `${bone} is not in exactly the three beam controllers`);
      for (const x of by) assert.equal(x.material, 'entity_alphablend', `${x.id} does not draw ${bone} translucent`);
    } else {
      assert.equal(by.length, 1, `${bone} is drawn by ${by.length} controllers`);
      assert.equal(by[0].cond, true, `${bone} is not always shown`);
    }
  }
  for (const name of ['disc', 'rim', 'dome', 'rim_lights']) assert.ok(shown.has(name), `no controller draws ${name}`);
  assert.equal(shown.get('dome')[0].material, 'entity_alphablend');
  for (const x of shown.get('beam')) assert.equal(x.cond, BEAM_ON, `${x.id} shows the beam bone by ${x.cond}`);

  // Each band controller paints its own texture, a file in the pack.
  for (const band of Object.keys(BANDS)) {
    const rc = controllers[beamController(band)];
    assert.deepEqual(rc.textures, [`Texture.${band}`]);
    assert.equal(client.textures[band], `textures/entity/ufo_${band}`);
    assert.ok(
      ['png', 'tga'].some((ext) => existsSync(join(projectRoot, 'packs/resource', `${client.textures[band]}.${ext}`))),
      `${client.textures[band]} is not a file under packs/resource`,
    );
  }

  // The slice phase is (i + floor(life_time · 8)) mod 4. Every comparison is in its own parentheses: the
  // client binds && tighter than ==, so `beam && phase == 0` reads as `(beam && phase) == 0` and stays lit with the beam off.
  for (const [i, slice] of SLICES.entries()) {
    const phase = `math.mod(${i} + math.floor(q.life_time * 8), 4)`;
    for (const x of shown.get(slice)) {
      const values = BANDS[Object.keys(BANDS).find((band) => beamController(band) === x.id)];
      const test = values.length === 1 ? `(${phase} == ${values[0]})` : `(${values.map((v) => `(${phase} == ${v})`).join(' || ')})`;
      assert.equal(x.cond, `${BEAM_ON} && ${test}`, `${x.id} shows ${slice} by ${x.cond}`);
    }
  }

  // Evaluated: with the beam on, every slice is in exactly one band at every phase, the band its phase names; with it off, in none.
  const visible = (slice, beam, k) =>
    Object.keys(BANDS).filter((band) => molang(shown.get(slice).find((x) => x.id === beamController(band)).cond)(beam, k / 8 + 0.01));
  for (const [i, slice] of SLICES.entries())
    for (let k = 0; k < 8; k++) {
      const on = visible(slice, true, k);
      assert.equal(on.length, 1, `${slice} at phase step ${k}: shown by ${on.join(', ') || 'none'}`);
      assert.ok(BANDS[on[0]].includes((i + k) % 4), `${slice} at phase step ${k} is ${on[0]}`);
      assert.deepEqual(visible(slice, false, k), [], `${slice} shows with the beam off`);
    }
  // The bands move toward beam_00, the top slice, as life_time grows: upward.
  for (let i = 1; i < SLICES.length; i++)
    for (let k = 0; k < 7; k++) assert.deepEqual(visible(SLICES[i - 1], true, k + 1), visible(SLICES[i], true, k), `the band at ${SLICES[i]} does not move up to ${SLICES[i - 1]}`);

  const animations = {};
  for (const f of readdirSync(join(projectRoot, 'packs/resource/animations'))) Object.assign(animations, readJson(`packs/resource/animations/${f}`).animations);
  for (const key of client.scripts.animate) {
    const id = client.animations[key];
    assert.ok(animations[id], `${key} → ${id} is not defined under animations/`);
    for (const bone of Object.keys(animations[id].bones)) assert.ok(bones.has(bone), `${id} moves a bone ${bone} the geometry lacks`);
  }
  const spin = animations[client.animations.spin];
  assert.equal(spin.loop, true);
  assert.deepEqual(Object.keys(spin.bones).sort(), ['disc', 'dome', 'rim', 'rim_lights']);
  const scale = animations[client.animations.beam_length].bones.beam.scale;
  assert.equal(scale[0], 1);
  assert.equal(scale[2], 1);
  assert.match(scale[1], /q\.property\('andrew:beam_len'\)/);
  assert.match(scale[1], /\/ 40$/, 'the beam scale does not divide by the bone\'s 40-block length');
});

test('RP: sound_definitions.json defines the hum UFO_SOUNDS plays, on an .ogg in the pack', () => {
  const defs = readJson('packs/resource/sounds/sound_definitions.json').sound_definitions;
  const hum = defs[UFO_SOUNDS.hum];
  assert.ok(hum, `${UFO_SOUNDS.hum} is not defined`);
  assert.ok(hum.sounds.length >= 1, `${UFO_SOUNDS.hum} has no sounds`);
  for (const snd of hum.sounds) {
    const name = typeof snd === 'string' ? snd : snd.name;
    assert.ok(existsSync(join(projectRoot, 'packs/resource', `${name}.ogg`)), `${name}.ogg is not in packs/resource`);
  }
});
