// The UFO saucer (src/ufo/saucer.ts, L0-sauc) over fakes: the §2 path and its
// step bound, the beam property and the sounds against the real core's phase
// clock, and the entity's two packs read as files — the BP shape of R-sauc-3
// and the RP model, beam bone and animations of L0-sauc-ent1. The engine half
// is src/gametest/ufo-saucer.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
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
        export { PHASE_TICKS, PAUSE_MS, FIRST_MIN_MS, FIRST_MAX_MS } from './src/ufo/env.ts';`,
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
  BEAM_LEN_MAX,
  BEAM_LEN_PROPERTY,
  BEAM_PROPERTY,
  EVENT_PROPERTY,
  HOVER_DRIFT,
  HUM_TICKS,
  SOUND_VOLUME,
  UFO_SOUNDS,
  beamLength,
  createSaucer,
  departEase,
  flightPath,
  legHeight,
  legPosition,
  smoothstep,
  UfoCore,
  SAUCER_ID,
  UFO_TAG,
  EVENT_TAG,
  horizontalDistance,
  PHASE_TICKS,
  PAUSE_MS,
  FIRST_MIN_MS,
  FIRST_MAX_MS,
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

function fakeEngine() {
  const engine = { spawned: [], played: [], tick: 0 };
  engine.overworld = {
    spawnEntity(typeId, at) {
      const e = { id: `e${engine.spawned.length}`, typeId, isValid: true, removed: false, location: { ...at }, tags: [], dp: {}, props: {}, pending: [], writes: [], teleports: 0 };
      e.addTag = (t) => e.tags.push(t);
      e.setDynamicProperty = (k, v) => (e.dp[k] = v);
      // Like the engine: "this property change is not applied until the next tick".
      e.setProperty = (k, v) => {
        e.pending.push([k, v]);
        e.writes.push({ k, v, tick: engine.tick });
      };
      e.teleport = (to) => {
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

function rig({ durations = PHASE_TICKS, theta01 = 0.25, spy = true } = {}) {
  const engine = fakeEngine();
  const r = { engine, ticks: 0, sounds: [], samples: [] };
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
    log() {},
  };
  r.saucer = createSaucer({
    overworld: () => engine.overworld,
    random: () => theta01,
    durations,
    ceiling: env.ceiling,
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
  assert.equal(hums.length, 29);
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

test('RP: one geometry fills the hull band [y, y + 3] within r 6, the beam bone hangs 40 blocks to a 5-block radius, the bounds hold both', () => {
  const geo = readJson('packs/resource/models/entity/ufo_saucer.geo.json')['minecraft:geometry'];
  assert.equal(geo.length, 1);
  const g = geo[0];
  assert.equal(g.description.identifier, 'geometry.andrew.ufo_saucer');
  const bones = new Map(g.bones.map((b) => [b.name, b]));
  for (const name of ['disc', 'rim', 'dome', 'rim_lights', 'beam']) assert.ok(bones.has(name), `no ${name} bone`);
  for (const name of ['disc', 'rim', 'dome', 'rim_lights']) {
    const pts = bones.get(name).cubes.flatMap(corners);
    assert.ok(pts.every((p) => p.y >= 0 && p.y <= 3 * PX), `${name} leaves the hull band`);
    const r = Math.max(...pts.map((p) => Math.hypot(p.x, p.z)));
    assert.ok(r <= 6 * PX + 1e-9, `${name} reaches ${(r / PX).toFixed(2)} blocks out`);
  }
  const all = ['disc', 'rim', 'dome'].flatMap((n) => bones.get(n).cubes.flatMap(corners));
  assert.ok(Math.min(...all.map((p) => p.y)) === 0 && Math.max(...all.map((p) => p.y)) === 3 * PX, 'the disc and dome do not span the band');
  assert.ok(Math.max(...bones.get('rim').cubes.flatMap(corners).map((p) => Math.hypot(p.x, p.z))) >= 5.5 * PX, 'the disc is not ~12 blocks across');
  assert.equal(bones.get('rim_lights').cubes.length >= 12 && bones.get('rim_lights').cubes.length <= 16, true);

  const beam = bones.get('beam').cubes.flatMap(corners);
  const top = Math.max(...beam.map((p) => p.y));
  const bottom = Math.min(...beam.map((p) => p.y));
  assert.ok(top <= 0, 'the beam reaches into the disc');
  assert.equal(Math.round((top - bottom) / PX), 40, 'the beam bone is not 40 blocks long at beam_len 40');
  const widest = Math.max(...beam.filter((p) => p.y === bottom).map((p) => Math.max(Math.abs(p.x), Math.abs(p.z))));
  assert.equal(widest / PX, 5, 'the beam does not end at a 5-block radius');
  const narrowest = Math.max(...beam.filter((p) => p.y === top).map((p) => Math.max(Math.abs(p.x), Math.abs(p.z))));
  assert.ok(narrowest < widest / 4, 'the beam is not a cone');

  const { visible_bounds_width: w, visible_bounds_height: h, visible_bounds_offset: off } = g.description;
  assert.ok(w >= 14, `bounds ${w} wide`);
  assert.ok(off[1] - h / 2 <= -BEAM_LEN_MAX && off[1] + h / 2 >= 4, `bounds span ${off[1] - h / 2} … ${off[1] + h / 2}`);
});

test('RP: the client entity resolves its geometry, controllers and animations; the beam shows by q.property and scales by beam_len', () => {
  const client = readJson('packs/resource/entity/ufo_saucer.entity.json')['minecraft:client_entity'].description;
  assert.equal(client.identifier, SAUCER_ID);
  const geo = readJson('packs/resource/models/entity/ufo_saucer.geo.json')['minecraft:geometry'][0];
  const bones = new Set(geo.bones.map((b) => b.name));
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
        assert.ok(!shown.has(bone), `${bone} is drawn by two controllers`);
        shown.set(bone, { id, cond, material: client.materials[Object.values(rc.materials[0])[0].replace(/^Material\./, '')] });
      }
  }
  assert.deepEqual([...shown.keys()].sort(), [...bones].sort(), 'a bone no controller draws');
  assert.equal(shown.get('beam').cond, "q.property('andrew:beam')");
  for (const name of ['disc', 'rim', 'dome', 'rim_lights']) assert.equal(shown.get(name).cond, true);
  assert.equal(shown.get('beam').material, 'entity_alphablend');
  assert.equal(shown.get('dome').material, 'entity_alphablend');

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
