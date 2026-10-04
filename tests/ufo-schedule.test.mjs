// The UFO event core (src/ufo/) on a fake clock and fake players: the schedule
// of UFO §2 (first window, +15 min after a departure or a shot, waiting for an
// Overworld player), the restart marker, the phase machine and its order, the
// commands, the sweeps, and the idle cost. Product code over fakes; the engine
// half is src/gametest/ufo-core.ts and src/selftest/ufo-restart.ts.

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
        export * from './src/ufo/event.ts';
        export * from './src/ufo/schedule.ts';
        export * from './src/ufo/env.ts';
        export * from './src/ufo/saucer.ts';
        export * from './src/ufo/commands.ts';
        export { startUfo, DIMENSIONS, DEFAULT_SCOPE } from './src/ufo/index.ts';`,
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
  UfoCore,
  NEXT_MS,
  ENABLED,
  IN_FLIGHT,
  IDLE_CHECK_TICKS,
  PHASE_TICKS,
  PAUSE_MS,
  FIRST_MIN_MS,
  FIRST_MAX_MS,
  ARRIVAL_TEXT,
  NOTICE_RANGE,
  UFO_TAG,
  EVENT_TAG,
  IRON_TAG,
  SAUCER_ID,
  hoverHeight,
  centreUnder,
  overworldCandidates,
  createSaucer,
  APPROACH_DISTANCE,
  registerUfoCommand,
  UFO_COMMAND,
  runCore,
  startUfo,
} = m;

const MS_PER_TICK = 50;
const SHORT = { arrival: 4, magnet: 6, departure: 3, downed: 2 };
const T0 = 1_790_000_000_000;
/** The idle check runs every IDLE_CHECK_TICKS; at 50 ms a tick that is how late an arrival may start. */
const IDLE_SLACK_MS = IDLE_CHECK_TICKS * MS_PER_TICK;

function player(id, x = 0.5, y = -60, z = 0.5) {
  const p = { id, name: id, location: { x, y, z }, inbox: [], sendMessage: (msg) => p.inbox.push(msg) };
  return p;
}

function fixture({ random = () => 0.5, players = [], durations = SHORT, ceiling = 320, scope = 'ut' } = {}) {
  const data = new Map();
  const counts = { reads: 0, writes: 0, now: 0 };
  const logs = [];
  const fx = {
    t: T0,
    players,
    data,
    counts,
    logs,
    advance(ms) {
      fx.t += ms;
    },
  };
  fx.env = {
    now: () => {
      counts.now++;
      return fx.t;
    },
    durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: () => fx.players.slice(),
    random: () => random(),
    store: {
      get: (k) => {
        counts.reads++;
        return data.get(k);
      },
      set: (k, v) => {
        counts.writes++;
        if (v === undefined) data.delete(k);
        else data.set(k, v);
      },
    },
    ceiling: () => ceiling,
    log: (msg) => logs.push(msg),
  };
  fx.saucer = fakeSaucer();
  fx.phases = [];
  fx.recorder = {
    onPhase: (phase, payload) => fx.phases.push({ phase, payload, t: fx.t, tick: fx.ticks }),
  };
  fx.ticks = 0;
  fx.core = new UfoCore(fx.env, { scope, saucer: fx.saucer, listeners: [fx.recorder] });
  fx.tick = (n = 1, ms = MS_PER_TICK) => {
    for (let i = 0; i < n; i++) {
      fx.advance(ms);
      fx.ticks++;
      fx.core.tick();
    }
  };
  /** Ticks until `cond` holds; returns how many it took, or Infinity. */
  fx.until = (cond, max = 100_000, ms = MS_PER_TICK) => {
    for (let i = 1; i <= max; i++) {
      fx.tick(1, ms);
      if (cond()) return i;
    }
    return Infinity;
  };
  return fx;
}

function fakeSaucer() {
  const s = {
    calls: [],
    valid: false,
    pos: undefined,
    onPhase(phase, p) {
      s.calls.push({ kind: 'phase', phase });
      if (phase === 'arrival') {
        s.valid = true;
        s.pos = { x: p.centre.x + 90.5, y: p.hoverY + 10, z: p.centre.z + 0.5 };
      }
      if (phase === 'pause') s.valid = false;
    },
    saucerStep(tick) {
      s.calls.push({ kind: 'step', tick });
    },
    saucerPosition() {
      return s.valid ? s.pos : undefined;
    },
  };
  return s;
}

const arrivals = (fx) => fx.phases.filter((p) => p.phase === 'arrival');
const phaseNames = (fx) => fx.phases.map((p) => p.phase);

// ------------------------------------------------------------ first arrival (AC1, L0-ufoc-ac01)

for (const [r, offset] of [
  [0, 600_000],
  [1, 1_200_000],
  [0.5, 900_000],
]) {
  test(`first join with random ${r}: next arrival = join + ${offset} ms`, () => {
    const fx = fixture({ random: () => r });
    fx.core.firstJoin();
    assert.equal(fx.data.get(NEXT_MS), T0 + offset);
  });
}

test('a second first join while next_ms is present changes nothing (negative control)', () => {
  const fx = fixture({ random: () => 0 });
  fx.core.firstJoin();
  const first = fx.data.get(NEXT_MS);
  fx.advance(5_000);
  fx.core.firstJoin();
  assert.equal(fx.data.get(NEXT_MS), first);
});

for (const r of [0, 0.25, 0.5, 0.75, 0.999, 1]) {
  test(`random ${r}: the first arrival lands 10–20 min after the first join, never before next_ms, within one idle check after it`, () => {
    const fx = fixture({ random: () => r, players: [player('a')] });
    const join = fx.t;
    fx.core.firstJoin();
    const next = fx.data.get(NEXT_MS);
    fx.until(() => arrivals(fx).length > 0, 30 * 60 * 20);
    const [arrival] = arrivals(fx);
    assert.ok(arrival, 'no arrival within 30 minutes');
    assert.ok(arrival.t >= next, `the arrival started at ${arrival.t}, before next_ms ${next}`);
    assert.ok(arrival.t <= next + IDLE_SLACK_MS, `the arrival started ${arrival.t - next} ms after next_ms, more than one idle check`);
    const after = arrival.t - join;
    assert.ok(after >= 10 * 60_000 && after <= 20 * 60_000 + IDLE_SLACK_MS, `first arrival ${after} ms after the join`);
  });
}

// ------------------------------------------------------------ +15 min (AC1, L0-ufoc-ac02)

test('after a departure the next arrival is exactly 15 min after the end tick, and comes within one idle check after it', () => {
  const fx = fixture({ players: [player('a')] });
  fx.data.set(NEXT_MS, fx.t + 1);
  fx.until(() => fx.phases.some((p) => p.phase === 'pause'));
  const pause = fx.phases.find((p) => p.phase === 'pause');
  assert.equal(fx.core.lastEnd().reason, 'departed');
  assert.equal(fx.data.get(NEXT_MS), pause.t + PAUSE_MS, 'next_ms is not the end tick + 15 min');
  const next = fx.data.get(NEXT_MS);
  fx.until(() => arrivals(fx).length > 1, 20 * 60 * 20);
  const second = arrivals(fx)[1];
  assert.ok(second.t >= next && second.t <= next + IDLE_SLACK_MS, `second arrival ${second.t - next} ms off next_ms`);
});

test('a shoot-down sets next_ms = shot + 15 min at once; the release comes on the next UFO tick; a second report changes nothing', () => {
  const fx = fixture({ players: [player('a')] });
  fx.core.command('come', 'a');
  fx.until(() => fx.core.session()?.phase === 'magnet');
  const { eventId } = fx.core.session();
  const shotAt = fx.t;
  const before = fx.phases.length;
  fx.core.reportShotDown({ eventId, ownerId: 'o', ownerName: 'owner' });
  assert.equal(fx.data.get(NEXT_MS), shotAt + PAUSE_MS, 'next_ms is not the shot + 15 min');
  assert.deepEqual(phaseNames(fx).slice(before), ['downed'], 'something other than downed ran inside the caller');
  fx.advance(1_000);
  fx.core.reportShotDown({ eventId, ownerId: 'o', ownerName: 'owner' });
  assert.equal(fx.data.get(NEXT_MS), shotAt + PAUSE_MS, 'the second report moved next_ms');
  assert.deepEqual(phaseNames(fx).slice(before), ['downed'], 'the second report published again');
  fx.tick();
  assert.deepEqual(phaseNames(fx).slice(before), ['downed', 'release'], 'the release did not come on the next tick');
  fx.until(() => fx.core.session() === undefined);
  assert.equal(fx.core.lastEnd().reason, 'downed');
  assert.equal(fx.data.get(NEXT_MS), shotAt + PAUSE_MS, 'the end of downed moved next_ms off the shot');
  fx.until(() => arrivals(fx).length > 1, 20 * 60 * 20);
  const second = arrivals(fx)[1];
  assert.ok(second.t >= shotAt + PAUSE_MS && second.t <= shotAt + PAUSE_MS + IDLE_SLACK_MS, `arrival ${second.t - shotAt - PAUSE_MS} ms off shot + 15 min`);
});

test('a shot in the arrival phase publishes no release (the magnet was never on)', () => {
  const fx = fixture({ players: [player('a')] });
  fx.core.command('come', 'a');
  fx.tick(2);
  const { eventId } = fx.core.session();
  fx.core.reportShotDown({ eventId, ownerId: 'o', ownerName: 'o' });
  fx.until(() => fx.core.session() === undefined);
  assert.deepEqual(phaseNames(fx), ['arrival', 'downed', 'pause']);
});

test('a report for another event id is ignored', () => {
  const fx = fixture({ players: [player('a')] });
  fx.core.command('come', 'a');
  fx.tick(2);
  fx.core.reportShotDown({ eventId: 'ut-0-0', ownerId: 'o', ownerName: 'o' });
  assert.equal(fx.core.session().phase, 'arrival');
  assert.equal(fx.data.get(NEXT_MS), IN_FLIGHT);
});

// ------------------------------------------------------------ waiting (AC1, AC3)

test('due with no Overworld player: no arrival while nobody is there; one within an idle check after a player appears, centred on them', () => {
  const fx = fixture({ players: [] });
  fx.data.set(NEXT_MS, fx.t - 1);
  fx.tick(IDLE_CHECK_TICKS * 30);
  assert.equal(arrivals(fx).length, 0, 'an arrival started with nobody in the Overworld');
  assert.equal(fx.data.get(NEXT_MS), T0 - 1, 'waiting rewrote next_ms');
  fx.players = [player('late', 100.7, 64.2, -20.3)];
  const took = fx.until(() => arrivals(fx).length > 0, IDLE_CHECK_TICKS * 2);
  assert.ok(took <= IDLE_CHECK_TICKS, `the arrival took ${took} ticks after the player appeared`);
  assert.deepEqual({ ...arrivals(fx)[0].payload.centre }, { x: 100, y: 63, z: -21 });
  assert.equal(fx.core.session().targetId, 'late');
});

test('missed arrivals do not accumulate: hours overdue, one arrival', () => {
  const fx = fixture({ players: [] });
  fx.data.set(NEXT_MS, fx.t - 5 * 3_600_000);
  fx.tick(IDLE_CHECK_TICKS * 3);
  fx.players = [player('a')];
  fx.until(() => fx.core.session() === undefined && arrivals(fx).length > 0, 10_000);
  fx.tick(IDLE_CHECK_TICKS * 5);
  assert.equal(arrivals(fx).length, 1);
});

test('the target is drawn through env.random over the candidates', () => {
  const fx = fixture({ random: () => 0.99, players: [player('a'), player('b'), player('c')] });
  fx.data.set(NEXT_MS, fx.t);
  fx.until(() => arrivals(fx).length > 0, 200);
  assert.equal(fx.core.session().targetId, 'c');
});

// ------------------------------------------------------------ restart marker (ad03, p003)

test('worldLoaded: the in-flight marker 0 becomes now + 15 min; a future time and an absent one are left alone', () => {
  const a = fixture();
  a.data.set(NEXT_MS, IN_FLIGHT);
  a.core.worldLoaded();
  assert.equal(a.data.get(NEXT_MS), T0 + PAUSE_MS);
  const b = fixture();
  b.data.set(NEXT_MS, T0 + 123_456);
  b.core.worldLoaded();
  assert.equal(b.data.get(NEXT_MS), T0 + 123_456);
  const c = fixture();
  c.core.worldLoaded();
  assert.equal(c.data.has(NEXT_MS), false);
});

test('a due time at load is not pushed: the event waits for a player instead of adding 15 min', () => {
  const fx = fixture();
  fx.data.set(NEXT_MS, T0 - 60_000);
  fx.core.worldLoaded();
  assert.equal(fx.data.get(NEXT_MS), T0 - 60_000);
});

test('arrival start writes the in-flight marker; every end path overwrites it', () => {
  for (const end of ['departed', 'stop', 'abort']) {
    const fx = fixture({ players: [player('a')] });
    fx.core.command('come', 'a');
    fx.tick();
    assert.equal(fx.data.get(NEXT_MS), IN_FLIGHT, 'no marker at arrival start');
    if (end === 'stop') fx.core.command('stop');
    if (end === 'abort') fx.saucer.valid = false;
    fx.until(() => fx.core.session() === undefined);
    assert.equal(fx.core.lastEnd().reason, end);
    assert.equal(fx.data.get(NEXT_MS), fx.t + PAUSE_MS, `${end}: next_ms is not now + 15 min`);
  }
});

// ------------------------------------------------------------ phases (L0-ufoc-ac04 with product durations)

test('real durations: arrival → magnet 400 → release + departure in one tick 1200 later → pause 300 later; one eventId; saucerStep every active tick, magnetStep only in magnet, after it', () => {
  const order = [];
  const fx = fixture({ players: [player('a', 3.5, -59, 3.5)], durations: PHASE_TICKS });
  const magnet = {
    onPhase: (phase) => order.push(`m:${phase}`),
    magnetStep: (tick) => order.push(`magnetStep:${tick}`),
  };
  const saucer = fx.saucer;
  const origStep = saucer.saucerStep;
  saucer.saucerStep = (tick) => {
    order.push(`saucerStep:${tick}`);
    origStep(tick);
  };
  fx.core = new UfoCore(fx.env, { scope: 'ut', saucer, magnet, listeners: [fx.recorder] });
  fx.core.command('come', 'a');
  fx.until(() => fx.phases.some((p) => p.phase === 'pause'), 5_000);
  assert.deepEqual(phaseNames(fx), ['arrival', 'magnet', 'release', 'departure', 'pause']);
  const at = Object.fromEntries(fx.phases.map((p) => [p.phase, p.tick]));
  assert.equal(at.magnet - at.arrival, 400);
  assert.equal(at.release, at.departure);
  assert.equal(at.departure - at.magnet, 1200);
  assert.equal(at.pause - at.departure, 300);
  assert.equal(new Set(fx.phases.map((p) => p.payload.eventId)).size, 1);
  assert.ok(fx.phases.every((p) => p.payload.hoverY === hoverHeight(-60, 320) && p.payload.hoverY === -20));
  const steps = order.filter((o) => o.startsWith('saucerStep:')).map((o) => Number(o.split(':')[1]));
  const active = at.pause - at.arrival - 1;
  assert.equal(steps.length, active, `saucerStep ran ${steps.length} times over ${active} active ticks`);
  const mags = order.filter((o) => o.startsWith('magnetStep:')).map((o) => Number(o.split(':')[1]));
  assert.equal(mags.length, 1200 - 1 + 1, 'magnetStep is not called on every magnet tick');
  assert.ok(mags.every((t) => t >= at.magnet && t < at.departure), 'magnetStep outside the magnet phase');
  for (const t of mags) assert.ok(order.indexOf(`saucerStep:${t}`) < order.indexOf(`magnetStep:${t}`), `tick ${t}: magnetStep before saucerStep`);
});

test('hover height: centre + 40, at most ceiling − 15 (UFO §2)', () => {
  assert.equal(hoverHeight(-61, 320), -21);
  assert.equal(hoverHeight(264, 320), 304);
  assert.equal(hoverHeight(265, 320), 305);
  assert.equal(hoverHeight(290, 320), 305);
  const fx = fixture({ players: [player('high', 4.5, 291, 4.5)] });
  fx.core.command('come', 'high');
  fx.tick();
  assert.equal(fx.core.session().hoverY, 305);
  assert.deepEqual({ ...fx.core.session().centre }, { x: 4, y: 290, z: 4 });
});

test('centre: the block under the feet, frozen', () => {
  assert.deepEqual(centreUnder({ x: -0.2, y: -60, z: 7.9 }), { x: -1, y: -61, z: 7 });
  const a = player('a', 0.5, -60, 0.5);
  const fx = fixture({ players: [a] });
  fx.core.command('come', 'a');
  fx.tick();
  a.location = { x: 500, y: 100, z: 500 };
  fx.until(() => fx.core.session()?.phase === 'magnet');
  assert.deepEqual({ ...fx.phases.at(-1).payload.centre }, { x: 0, y: -61, z: 0 });
});

test('a lost saucer aborts: the release runs when the magnet was on, the event ends, next_ms is now + 15 min', () => {
  const fx = fixture({ players: [player('a')] });
  fx.core.command('come', 'a');
  fx.until(() => fx.core.session()?.phase === 'magnet');
  fx.saucer.valid = false;
  fx.until(() => fx.core.session() === undefined, 10);
  assert.deepEqual(phaseNames(fx), ['arrival', 'magnet', 'release', 'pause']);
  assert.equal(fx.core.lastEnd().reason, 'abort');
  assert.equal(fx.data.get(NEXT_MS), fx.t + PAUSE_MS);
});

test('a saucer that throws at arrival leaves no saucer: the event aborts on the next tick and nobody is told of a UFO', () => {
  const told = [];
  const a = { ...player('a'), sendMessage: (m) => told.push(m) };
  const fx = fixture({ players: [a] });
  fx.saucer.onPhase = (phase) => {
    if (phase === 'arrival') throw new Error('spawn refused: unloaded chunk');
  };
  fx.core.command('come', 'a');
  fx.tick(2);
  assert.equal(fx.core.session(), undefined);
  assert.equal(fx.core.lastEnd().reason, 'abort');
  assert.ok(fx.logs.some((l) => /the saucer listener threw on arrival: Error: spawn refused/.test(l)), fx.logs.join('\n'));
  assert.ok(fx.logs.some((l) => /notice to none, no saucer/.test(l)), fx.logs.join('\n'));
  assert.deepEqual(told, []);
});

test('a listener that throws on every phase is logged by name; the saucer, the magnet and the listeners after it go on to the departure', () => {
  const told = [];
  const a = { ...player('a'), sendMessage: (m) => told.push(m) };
  const fx = fixture({ players: [a] });
  const heard = { stub: [], magnet: [], after: [], unnamed: [] };
  const magnet = { onPhase: (phase) => heard.magnet.push(phase), magnetStep() {} };
  const stub = {
    name: 'stub',
    onPhase: (phase) => {
      heard.stub.push(phase);
      throw new Error(`stub refuses ${phase}`);
    },
  };
  const unnamed = {
    onPhase: (phase) => {
      heard.unnamed.push(phase);
      if (phase === 'magnet') throw new Error('unnamed refuses magnet');
    },
  };
  const after = { onPhase: (phase) => heard.after.push(phase) };
  fx.core = new UfoCore(fx.env, { scope: 'ut', saucer: fx.saucer, magnet, listeners: [stub, unnamed, after, fx.recorder] });
  fx.core.command('come', 'a');
  fx.until(() => fx.core.session() === undefined && fx.phases.some((p) => p.phase === 'pause'));
  const all = ['arrival', 'magnet', 'release', 'departure', 'pause'];
  assert.deepEqual(phaseNames(fx), all);
  assert.equal(fx.core.lastEnd().reason, 'departed');
  for (const [who, got] of Object.entries(heard)) assert.deepEqual(got, all, `${who} heard ${got.join(',')}`);
  for (const phase of all) assert.ok(fx.logs.some((l) => l.endsWith(`the stub listener threw on ${phase}: Error: stub refuses ${phase}`)), `no line for ${phase}:\n${fx.logs.join('\n')}`);
  assert.ok(fx.logs.some((l) => l.endsWith('the listener 2 listener threw on magnet: Error: unnamed refuses magnet')), fx.logs.join('\n'));
  assert.ok(!fx.logs.some((l) => /abort/.test(l)), fx.logs.join('\n'));
  assert.equal(told.length, 1);
  assert.equal(fx.saucer.calls.filter((c) => c.kind === 'step').length > 0, true);
});

test('a magnet that throws at magnet-on is logged as the magnet; the saucer still hovers and leaves', () => {
  const fx = fixture({ players: [player('a')] });
  const magnet = {
    onPhase: (phase) => {
      if (phase === 'magnet') throw new Error('scan failed');
    },
    magnetStep() {},
  };
  fx.core = new UfoCore(fx.env, { scope: 'ut', saucer: fx.saucer, magnet, listeners: [fx.recorder] });
  fx.core.command('come', 'a');
  fx.until(() => fx.core.session() === undefined && fx.phases.some((p) => p.phase === 'pause'));
  assert.deepEqual(phaseNames(fx), ['arrival', 'magnet', 'release', 'departure', 'pause']);
  assert.equal(fx.core.lastEnd().reason, 'departed');
  assert.ok(fx.logs.some((l) => l.endsWith('the magnet listener threw on magnet: Error: scan failed')), fx.logs.join('\n'));
});

// ------------------------------------------------------------ notice (L0-ufoc-r005, ac07)

test('the arrival notice reaches Overworld players within 150 blocks horizontally, once; not the far ones', () => {
  const a = player('A', 0.5, -60, 0.5);
  const b = player('B', 0.5, 30, 149.5);
  const c = player('C', 0.5, -60, 151.5);
  const fx = fixture({ players: [a, b, c] });
  fx.core.command('come', 'A');
  fx.until(() => fx.core.session() === undefined, 100);
  assert.equal(a.inbox.length, 1);
  assert.equal(b.inbox.length, 1);
  assert.equal(c.inbox.length, 0);
  assert.deepEqual(a.inbox[0], { rawtext: [{ translate: ARRIVAL_TEXT }] });
  assert.equal(NOTICE_RANGE, 150);
});

test('lang: andrew.ufo.arrival has the spec texts in en_US and ru_RU (UFO §12)', () => {
  const read = (f) => readFileSync(join(projectRoot, 'packs', 'resource', 'texts', f), 'utf-8').split('\n');
  assert.ok(read('en_US.lang').includes('andrew.ufo.arrival=A UFO is in the sky!'));
  assert.ok(read('ru_RU.lang').includes('andrew.ufo.arrival=В небе НЛО!'));
  assert.equal(ARRIVAL_TEXT, 'andrew.ufo.arrival');
});

test('candidates: undefined, invalid, other dimensions and the dead are not targets', () => {
  const p = (id, dim, health, isValid = true) => ({ id, isValid, dimension: { id: dim }, getComponent: () => (health === undefined ? undefined : { currentValue: health }) });
  const list = [undefined, p('ok', 'minecraft:overworld', 20), p('nether', 'minecraft:nether', 20), p('end', 'minecraft:the_end', 20), p('dead', 'minecraft:overworld', 0), p('gone', 'minecraft:overworld', 20, false)];
  assert.deepEqual(overworldCandidates(list).map((x) => x.id), ['ok']);
});

// ------------------------------------------------------------ commands (L0-ufoc-p004, r006, as01)

test('come: refused while a UFO is up or already queued, and with nobody in the Overworld; targets the invoker when it can', () => {
  const fx = fixture({ players: [player('a'), player('b')], random: () => 0 });
  assert.equal(fixture({ players: [] }).core.command('come').ok, false);
  assert.equal(fx.core.command('come', 'b').ok, true);
  assert.equal(fx.core.command('come', 'b').ok, false, 'a second come in the same tick was accepted');
  fx.tick();
  assert.equal(fx.core.session().targetId, 'b');
  assert.equal(fx.core.session().source, 'command');
  assert.equal(fx.core.command('come', 'a').ok, false);
  fx.tick(3);
  assert.equal(arrivals(fx).length, 1);
});

test('come from a player who is not a candidate (another dimension, the console) picks a random Overworld player', () => {
  const fx = fixture({ players: [player('a'), player('b')], random: () => 0.6 });
  fx.core.command('come', 'in-the-nether');
  fx.tick();
  assert.equal(fx.core.session().targetId, 'b');
});

test('stop: the release (if on) and the end in the next UFO tick; the saucer is told pause; next_ms = now + 15 min', () => {
  const fx = fixture({ players: [player('a')] });
  fx.core.command('come', 'a');
  fx.until(() => fx.core.session()?.phase === 'magnet');
  assert.equal(fx.core.command('stop').ok, true);
  fx.tick();
  assert.equal(fx.core.session(), undefined);
  assert.deepEqual(phaseNames(fx).slice(-2), ['release', 'pause']);
  assert.equal(fx.core.lastEnd().reason, 'stop');
  assert.equal(fx.data.get(NEXT_MS), fx.t + PAUSE_MS);
  assert.equal(fx.core.command('stop').message, 'No UFO.');
});

test('disable: no scheduled arrival while due; disable mid-event stops it; come still works; enable pushes an overdue time 15 min out', () => {
  const fx = fixture({ players: [player('a')] });
  fx.core.command('disable');
  fx.tick();
  assert.equal(fx.data.get(ENABLED), false);
  fx.data.set(NEXT_MS, fx.t - 1);
  fx.tick(IDLE_CHECK_TICKS * 5);
  assert.equal(arrivals(fx).length, 0, 'a scheduled arrival started while disabled');
  fx.core.command('come', 'a');
  fx.tick();
  assert.equal(arrivals(fx).length, 1, 'come is refused while disabled');
  fx.core.command('disable');
  fx.tick();
  assert.equal(fx.core.session(), undefined, 'disable did not stop the live event');
  fx.data.set(NEXT_MS, fx.t - 10);
  fx.core.command('enable');
  fx.tick();
  assert.equal(fx.data.get(ENABLED), true);
  assert.equal(fx.data.get(NEXT_MS), fx.t + PAUSE_MS, 'enable left an overdue time');
  const future = fx.t + 42_000;
  fx.data.set(NEXT_MS, future);
  fx.core.command('enable');
  fx.tick();
  assert.equal(fx.data.get(NEXT_MS), future, 'enable moved a future time');
});

test('the command module registers one enum command at GameDirectors and answers from the core', () => {
  const registered = {};
  const startup = { subscribe: (cb) => cb({ customCommandRegistry: { registerEnum: (n, v) => (registered.enum = { n, v }), registerCommand: (c, fn) => Object.assign(registered, { c, fn }) } }) };
  const api = { system: { beforeEvents: { startup } }, CommandPermissionLevel: { GameDirectors: 1 }, CustomCommandParamType: { Enum: 'enum' }, CustomCommandStatus: { Success: 0, Failure: 1 } };
  const fx = fixture({ players: [] });
  registerUfoCommand(api, { core: () => fx.core });
  assert.equal(registered.c.name, UFO_COMMAND);
  assert.equal(UFO_COMMAND, 'andrew:ufo');
  assert.equal(registered.c.permissionLevel, 1);
  assert.deepEqual(registered.enum, { n: 'andrew:ufo_action', v: ['come', 'stop', 'enable', 'disable'] });
  assert.deepEqual(registered.c.mandatoryParameters, [{ name: 'andrew:ufo_action', type: 'enum' }]);
  assert.equal(registered.fn({ sourceEntity: undefined }, 'come').status, 1);
  assert.equal(registered.fn({ sourceEntity: undefined }, 'disable').status, 0);
  assert.equal(fx.core.pendingCommands(), 1);
});

test('the command refuses a player below GameDirectors itself (Entity.runCommand skips the engine gate); the server, a mob and an operator pass', () => {
  let fn;
  const startup = { subscribe: (cb) => cb({ customCommandRegistry: { registerEnum: () => {}, registerCommand: (_c, f) => (fn = f) } }) };
  const api = { system: { beforeEvents: { startup } }, CommandPermissionLevel: { Any: 0, GameDirectors: 1, Admin: 2 }, CustomCommandParamType: { Enum: 'enum' }, CustomCommandStatus: { Success: 0, Failure: 1 } };
  const fx = fixture({ players: [player('op'), player('guest')] });
  registerUfoCommand(api, { core: () => fx.core });
  const as = (level, id = 'guest') => ({ id, typeId: 'minecraft:player', commandPermissionLevel: level });
  const cow = { id: 'cow', typeId: 'minecraft:cow' };
  for (const action of ['come', 'stop', 'enable', 'disable']) {
    assert.equal(fn({ sourceEntity: as(0) }, action).status, 1, `a level-0 player's ${action} was answered`);
  }
  assert.equal(fn({ sourceEntity: cow, initiator: as(0) }, 'disable').status, 1, 'execute-as by a non-operator got through');
  assert.equal(fx.core.pendingCommands(), 0, 'a non-operator queued an action');
  assert.equal(fn({ sourceEntity: as(1, 'op') }, 'come').status, 0);
  assert.equal(fn({ sourceEntity: as(2, 'op') }, 'disable').status, 0);
  assert.equal(fn({}, 'enable').status, 0, 'the server was refused');
  assert.equal(fn({ sourceEntity: cow }, 'stop').status, 0, 'a non-player source was refused');
  assert.equal(fx.core.pendingCommands(), 3);
});

// ------------------------------------------------------------ sweeps (p003, xasm17)

function fakeEntity({ id, typeId = SAUCER_ID, tags = [] }) {
  const e = { id, typeId, isValid: true, tags: [...tags], removed: false };
  e.getTags = () => [...e.tags];
  e.hasTag = (t) => e.tags.includes(t);
  e.removeTag = (t) => {
    const had = e.tags.includes(t);
    e.tags = e.tags.filter((x) => x !== t);
    return had;
  };
  e.remove = () => {
    e.removed = true;
    e.isValid = false;
  };
  return e;
}

function fakeDimension(entities) {
  return {
    getEntities: (q) =>
      entities.filter((e) => e.isValid && (q.tags === undefined || q.tags.every((t) => e.tags.includes(t))) && (q.families === undefined || e.typeId === SAUCER_ID)),
  };
}

test('sweep at load: an orphan saucer, an untagged saucer and a stale one of this scope go; another scope stays; iron tags are stripped', () => {
  const fx = fixture({ scope: 'ufo' });
  const orphan = fakeEntity({ id: '1', tags: [UFO_TAG] });
  const untagged = fakeEntity({ id: '2' });
  const stale = fakeEntity({ id: '3', tags: [UFO_TAG, `${EVENT_TAG}ufo-1-1`] });
  const foreign = fakeEntity({ id: '4', tags: [UFO_TAG, `${EVENT_TAG}gt-1-1`] });
  const held = fakeEntity({ id: '5', typeId: 'minecraft:iron_golem', tags: [IRON_TAG] });
  const r = fx.core.sweep([fakeDimension([orphan, untagged, stale, foreign, held])]);
  assert.deepEqual(r, { removed: 3, untagged: 1 });
  assert.deepEqual([orphan, untagged, stale, foreign].map((e) => e.removed), [true, true, true, false]);
  assert.equal(held.removed, false);
  assert.deepEqual(held.tags, []);
});

test('entityLoad: the live saucer stays, a stale one goes, an unrelated entity is untouched; iron tags go only with no live session', () => {
  const fx = fixture({ players: [player('a')], scope: 'ufo' });
  fx.core.command('come', 'a');
  fx.tick();
  const live = fakeEntity({ id: 'l', tags: [UFO_TAG, `${EVENT_TAG}${fx.core.session().eventId}`] });
  const stale = fakeEntity({ id: 's', tags: [UFO_TAG, `${EVENT_TAG}ufo-1-1`] });
  const cow = fakeEntity({ id: 'c', typeId: 'minecraft:cow', tags: ['x'] });
  const heldNow = fakeEntity({ id: 'h', typeId: 'minecraft:minecart', tags: [IRON_TAG] });
  for (const e of [live, stale, cow, heldNow]) fx.core.entityLoaded(e);
  assert.deepEqual([live.removed, stale.removed, cow.removed], [false, true, false]);
  assert.deepEqual(heldNow.tags, [IRON_TAG], 'an iron tag was stripped during a live session');
  fx.core.command('stop');
  fx.tick();
  fx.core.entityLoaded(live);
  fx.core.entityLoaded(heldNow);
  assert.equal(live.removed, true, 'the ended event\'s saucer survived its load');
  assert.deepEqual(heldNow.tags, []);
});

// ------------------------------------------------------------ the saucer (UFO §2 geometry)

test('saucer: spawns 90 blocks out at hover + 10, holds the hover point through the magnet, leaves the opposite way, removed at pause', () => {
  const spawned = [];
  const overworld = {
    isChunkLoaded: () => true,
    spawnEntity: (id, at) => {
      const e = fakeEntity({ id: `e${spawned.length}`, typeId: id });
      e.location = { ...at };
      e.dp = {};
      e.addTag = (t) => e.tags.push(t);
      e.setDynamicProperty = (k, v) => (e.dp[k] = v);
      e.setProperty = (k, v) => (e.dp[k] = v);
      e.teleport = (to) => (e.location = { ...to });
      spawned.push(e);
      return e;
    },
    playSound: () => {},
  };
  const fx = fixture({ players: [player('a', 0.5, -60, 0.5)], random: () => 0.25 });
  const saucer = createSaucer({ overworld: () => overworld, random: () => 0.25, durations: SHORT, ceiling: () => 320 });
  fx.core = new UfoCore(fx.env, { scope: 'ut', saucer, listeners: [fx.recorder] });
  fx.core.command('come', 'a');
  fx.tick();
  const e = spawned[0];
  const { centre, hoverY, eventId } = fx.core.session();
  const d = (p) => Math.hypot(p.x - (centre.x + 0.5), p.z - (centre.z + 0.5));
  assert.equal(e.typeId, SAUCER_ID);
  assert.ok(Math.abs(d(e.location) - APPROACH_DISTANCE) < 1e-9, `spawned ${d(e.location)} blocks out`);
  assert.equal(e.location.y, hoverY + 10);
  assert.ok(e.tags.includes(UFO_TAG) && e.tags.includes(`${EVENT_TAG}${eventId}`));
  const start = { ...e.location };
  fx.until(() => fx.core.session()?.phase === 'magnet');
  assert.ok(d(e.location) < 1e-9 && e.location.y === hoverY, 'not at the hover point in the magnet phase');
  fx.until(() => fx.core.session() === undefined);
  assert.equal(e.removed, true);
  assert.equal(spawned.length, 1);
  const end = saucer.legs?.() ?? undefined;
  assert.equal(end, undefined, 'the path outlived the pause');
  assert.ok(Math.abs(start.x - (centre.x + 0.5)) < 1e-9 && start.z - (centre.z + 0.5) > 0, 'random 0.25 does not put the start due +z');
});

test('saucer legs never run above ceiling − 4 (L0-adr-ufht)', () => {
  assert.equal(m.legHeight(305, 320), 315);
  assert.equal(m.legHeight(310, 320), 316);
});

// ------------------------------------------------------------ one interval and the idle cost (C-5d, ac08)

test('idle: over 2000 ticks with no session, the clock and the store are each read at most 20 times', () => {
  const fx = fixture({ players: [player('a')] });
  fx.data.set(NEXT_MS, fx.t + 3_600_000);
  fx.counts.reads = 0;
  fx.counts.now = 0;
  fx.tick(2000);
  assert.ok(fx.counts.now <= 20, `now() read ${fx.counts.now} times`);
  assert.ok(fx.counts.reads <= 20, `the store read ${fx.counts.reads} times`);
  assert.equal(fx.counts.writes, 0, 'the idle path wrote to the store');
});

test('runCore creates exactly one period-1 interval, and its stopper clears it', () => {
  const calls = [];
  const host = { runInterval: (cb, n) => (calls.push(['interval', n]), 7), clearRun: (id) => calls.push(['clear', id]) };
  const stop = runCore(fixture().core, host);
  stop();
  assert.deepEqual(calls, [['interval', 1], ['clear', 7]]);
});

test('source: src/ufo/ holds exactly one runInterval and no runTimeout or runJob', () => {
  const dir = join(projectRoot, 'src', 'ufo');
  const text = readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => readFileSync(join(dir, f), 'utf-8'))
    .join('\n');
  assert.equal((text.match(/\.runInterval\(/g) ?? []).length, 1);
  assert.equal((text.match(/\.runTimeout\(|\.runJob\(/g) ?? []).length, 0);
});

test('startUfo: sweeps, reads the marker, subscribes spawn and load, starts one interval; the undo takes all of it back', () => {
  const fx = fixture();
  fx.data.set(NEXT_MS, IN_FLIGHT);
  const subs = { playerSpawn: [], entityLoad: [] };
  const signal = (name) => ({ subscribe: (cb) => (subs[name].push(cb), cb), unsubscribe: (cb) => (subs[name] = subs[name].filter((x) => x !== cb)) });
  const world = { getDimension: () => fakeDimension([]), afterEvents: { playerSpawn: signal('playerSpawn'), entityLoad: signal('entityLoad') } };
  const intervals = [];
  const host = { runInterval: (cb, n) => (intervals.push({ cb, n }), intervals.length), clearRun: (id) => (intervals[id - 1].cleared = true) };
  const undo = startUfo(fx.core, world, host);
  assert.equal(fx.data.get(NEXT_MS), T0 + PAUSE_MS, 'the marker was not read at start');
  assert.equal(intervals.length, 1);
  fx.data.delete(NEXT_MS);
  subs.playerSpawn[0]({ initialSpawn: false });
  assert.equal(fx.data.has(NEXT_MS), false, 'a respawn counted as the first join');
  subs.playerSpawn[0]({ initialSpawn: true });
  assert.equal(typeof fx.data.get(NEXT_MS), 'number');
  undo();
  assert.equal(intervals[0].cleared, true);
  assert.deepEqual([subs.playerSpawn.length, subs.entityLoad.length], [0, 0]);
});
