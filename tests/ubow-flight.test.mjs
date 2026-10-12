// Underwater Bow flight rules (spec §1; L0-uwbw-adfl, L0-uwbw-a003, C-42): the liquid inertia the bow's
// arrow gets, the air model against the probe's measured paths, and the judgement the BDS scenarios
// apply. The module runs with no engine: any runtime @minecraft import stays external and fails the load.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES_TS = join(projectRoot, 'src', 'ubow', 'flight-rules.ts');
const probe = readFileSync(join(projectRoot, 'docs', 'feedback', 'probe-ubow.md'), 'utf-8');

const bundle = await build({
  entryPoints: [RULES_TS],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const rules = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  ARROW_ID,
  FLIGHT_TAG,
  INFINITY_TAG,
  INFINITY,
  AIR_INERTIA,
  GRAVITY,
  VANILLA_LIQUID_INERTIA,
  AIR_TOLERANCE,
  SLOWED_CEILING,
  FULL_DRAW_DAMAGE,
  PARTIAL_DRAW_TICKS,
  PARTIAL_DRAW_DAMAGE,
  liquidInertiaFor,
  airStep,
  airPath,
  horizontal,
  speed,
  landingRun,
  airFlight,
  SPAWN_OFFSET_Y,
  ratio,
  within,
  compare,
  airLikeFailures,
  isSlowed,
  isVanillaFullDraw,
} = rules;

const V3 = { x: 0, y: 0, z: 3.0 };
const r2 = (n) => Math.round(n * 100) / 100;
const flightOf = (path, landing) => ({ samples: new Map(path.map((p, t) => [t, p])), landing });

test('the module bundles with no engine import', () => {
  assert.doesNotMatch(bundle.outputFiles[0].text, /@minecraft\//);
});

test('constants are the probe readings (docs/feedback/probe-ubow.md §2, §3) and C-42', () => {
  assert.equal(ARROW_ID, 'minecraft:arrow');
  assert.match(FLIGHT_TAG, /^andrew:/);
  assert.match(probe, /gravity 0\.050, airInertia 0\.990, liquidInertia \*\*0\.600\*\*/);
  assert.equal(GRAVITY, 0.05);
  assert.equal(AIR_INERTIA, 0.99);
  assert.equal(VANILLA_LIQUID_INERTIA, 0.6);
  assert.equal(AIR_TOLERANCE, 0.1);
  assert.equal(SLOWED_CEILING, 0.5);
  assert.match(probe, /\*\*6\.05–12\.08\*\*/);
  assert.ok(FULL_DRAW_DAMAGE.min <= 6.05 && FULL_DRAW_DAMAGE.max >= 12.08, 'the envelope holds every full-draw hit the probe measured');
  assert.match(probe, /Натяжение 6 тиков — 2\.00, 12 тиков — 4\.00/);
  assert.equal(PARTIAL_DRAW_TICKS, 12);
  assert.equal(PARTIAL_DRAW_DAMAGE, 4);
});

test('the Infinity tag answers the probe dupe: a custom shooter\'s Infinity arrow comes back as +1 arrow (probe §3)', () => {
  assert.match(INFINITY_TAG, /^andrew:/);
  assert.notEqual(INFINITY_TAG, FLIGHT_TAG);
  assert.equal(INFINITY, 'infinity');
  assert.match(probe, /\*\*shooter Infinity\*\* \| 64 → \*\*65\*\*/);
});

test('liquidInertiaFor gives the arrow its own air inertia', () => {
  assert.equal(liquidInertiaFor(0.99), 0.99);
  assert.equal(liquidInertiaFor(0.95), 0.95);
  assert.equal(liquidInertiaFor(1), 1);
});

test('liquidInertiaFor falls back to 0.99 on a value that would freeze, reverse or accelerate the arrow', () => {
  for (const bad of [undefined, Number.NaN, Number.POSITIVE_INFINITY, 0, -0.5, 1.01, 2]) {
    assert.equal(liquidInertiaFor(bad), AIR_INERTIA, `for ${bad}`);
  }
});

test('airStep drags every axis and pulls y down by gravity', () => {
  assert.deepEqual(airStep({ x: 1, y: 0, z: 2 }), { x: 0.99, y: -0.05, z: 1.98 });
  assert.deepEqual(airStep({ x: 1, y: 1, z: 1 }, 0.5, 0.1), { x: 0.5, y: 0.4, z: 0.5 });
});

test('airPath reproduces the probe air arrow: 3.00 5.97 8.91 … forward, 0.74 down at +6', () => {
  const path = airPath(V3, 9);
  assert.equal(path.length, 10);
  assert.deepEqual(path[0].at, { x: 0, y: 0, z: 0 });
  assert.deepEqual(path[0].v, V3);
  const runs = path.slice(1).map((p) => r2(p.at.z)).join(' ');
  assert.equal(runs, '3 5.97 8.91 11.82 14.7 17.56 20.38 23.18 25.94');
  assert.match(probe, /путь \+1…\+9: 3\.00 5\.97 8\.91 11\.82 14\.70 17\.56 20\.38 23\.18 25\.94; 16 блоков на \*\*\+6\*\*, просадка 0\.74/);
  assert.equal(r2(-path[6].at.y), 0.74);
  assert.ok(path[5].at.z < 16 && path[6].at.z >= 16, '16 blocks are reached at +6');
});

test('with vanilla liquid inertia the same model gives the probe water arrow: 1.80 1.08 0.66 0.40 0.26 0.18, 6.92 at +5', () => {
  const water = airPath(V3, 6, VANILLA_LIQUID_INERTIA);
  assert.equal(water.slice(1).map((p) => speed(p.v).toFixed(2)).join(' '), '1.80 1.08 0.66 0.40 0.26 0.18');
  assert.match(probe, /скорость 1\.80 1\.08 0\.66 0\.40 0\.26 0\.18 \(×0\.60 за тик\); на \+5 пройдено 6\.92 \(\*\*0\.47\*\* от воздуха\)/);
  assert.equal(water[5].at.z.toFixed(2), '6.92');
  const air = airPath(V3, 6);
  assert.equal(ratio(water[5].at.z, air[5].at.z).toFixed(2), '0.47');
});

test('the liquid-neutral arrow is the air arrow: liquid inertia = air inertia leaves the path unchanged', () => {
  const air = airPath({ x: 0.4, y: 0.3, z: 2.9 }, 12);
  const neutral = airPath({ x: 0.4, y: 0.3, z: 2.9 }, 12, liquidInertiaFor(AIR_INERTIA));
  assert.deepEqual(neutral, air);
});

test('horizontal and speed', () => {
  assert.equal(horizontal({ x: 3, y: 100, z: 4 }), 5);
  assert.equal(speed({ x: 2, y: 3, z: 6 }), 7);
});

test('landingRun: a level 3.0 shot from 1.5 up lands between +8 and +9 of the air path', () => {
  const path = airPath(V3, 10);
  const run = landingRun(V3, 1.5);
  assert.ok(run > path[8].at.z && run < path[9].at.z, `landing ${run}`);
  assert.ok(landingRun(V3, 3) > run, 'a higher start lands further');
  assert.equal(landingRun({ x: 0, y: 5, z: 1 }, 1, 3), undefined, 'still rising after three ticks');
});

test('airFlight samples the air path and lands where landingRun says', () => {
  const v0 = { x: 0.02, y: -0.03, z: 3.02 };
  const f = airFlight(v0, 8, 1.52);
  assert.equal(f.samples.size, 9);
  assert.deepEqual(f.samples.get(6), airPath(v0, 8)[6]);
  assert.equal(f.landing, landingRun(v0, 1.52));
  assert.equal(airFlight(v0, 8).landing, undefined, 'no floor, no landing');
});

test('the arrow flies 0.1 below its reported spawn point (the vanilla projectile offset)', () => {
  assert.equal(SPAWN_OFFSET_Y, -0.1);
});

test('ratio and within', () => {
  assert.equal(ratio(5, 10), 0.5);
  assert.equal(ratio(0, 0), 1);
  assert.equal(ratio(1, 0), Number.POSITIVE_INFINITY);
  assert.ok(within(10.9, 10));
  assert.ok(within(9.1, 10));
  assert.ok(!within(11.1, 10));
  assert.ok(!within(8.9, 10));
  assert.ok(!within(Number.NaN, 10));
  assert.ok(within(10.4, 10, 0.05));
  assert.ok(!within(10.6, 10, 0.05));
});

test('compare: an air flight against itself is 1.00 everywhere', () => {
  const air = flightOf(airPath(V3, 8), 25.9);
  const c = compare(air, air, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(c.ticks, [1, 2, 3, 4, 5, 6]);
  assert.ok(c.run.every((r) => r === 1));
  assert.ok(c.speed.every((r) => r === 1));
  assert.equal(c.landing, 1);
  assert.deepEqual(airLikeFailures(c, { needLanding: true }), []);
  assert.equal(isSlowed(c), false);
});

test('compare uses only ticks both flights were sampled at', () => {
  const air = flightOf(airPath(V3, 8));
  const short = flightOf(airPath(V3, 3));
  const c = compare(short, air, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(c.ticks, [1, 2, 3]);
  assert.equal(c.landing, undefined);
  assert.deepEqual(airLikeFailures(c, { minTicks: 3 }), []);
  assert.match(airLikeFailures(c, { minTicks: 4 })[0], /only 3 tick/);
  assert.match(airLikeFailures(c, { minTicks: 3, needLanding: true })[0], /no landing/);
});

test('a flight 3 % off the air one is air-like; one 15 % short is not, and says where', () => {
  const v0 = V3;
  const air = flightOf(airPath(v0, 8), 25.9);
  const near = flightOf(airPath({ x: 0, y: 0, z: 2.91 }, 8), 25.1);
  assert.deepEqual(airLikeFailures(compare(near, air, [1, 2, 3, 4, 5, 6]), { needLanding: true }), []);
  const far = flightOf(airPath({ x: 0, y: 0, z: 2.55 }, 8), 22.0);
  const failures = airLikeFailures(compare(far, air, [1, 2, 3, 4, 5, 6]), { needLanding: true });
  assert.ok(failures.some((f) => /^run at \+1 is 0\.85/.test(f)), failures.join('; '));
  assert.ok(failures.some((f) => /^speed at \+6 is 0\.85/.test(f)), failures.join('; '));
  assert.ok(failures.some((f) => /^landing is 0\.85/.test(f)), failures.join('; '));
});

test('the vanilla water arrow fails the air judgement and reads as slowed; the neutral one passes', () => {
  const ticks = [1, 2, 3, 4, 5, 6];
  const air = flightOf(airPath(V3, 8), landingRun(V3, 1.5));
  const water = flightOf(airPath(V3, 8, VANILLA_LIQUID_INERTIA), 7.45);
  const c = compare(water, air, ticks);
  assert.ok(airLikeFailures(c, { needLanding: true }).length > 0);
  assert.ok(isSlowed(c), `run at +6 ${c.run[5]}`);
  assert.ok(c.run[5] < SLOWED_CEILING);
  const neutral = flightOf(airPath(V3, 8, liquidInertiaFor(0.99)), landingRun(V3, 1.5));
  const n = compare(neutral, air, ticks);
  assert.deepEqual(airLikeFailures(n, { needLanding: true }), []);
  assert.equal(isSlowed(n), false);
});

test('isSlowed falls back to the landing when no tick was compared', () => {
  assert.equal(isSlowed({ ticks: [], run: [], speed: [], landing: 0.3 }), true);
  assert.equal(isSlowed({ ticks: [], run: [], speed: [], landing: 0.9 }), false);
  assert.equal(isSlowed({ ticks: [], run: [], speed: [] }), false, 'nothing measured is not a slowed arrow');
});

test('isVanillaFullDraw: the envelope bounds and nothing outside it', () => {
  for (const d of [6, 6.05, 8.23, 11.33, 12.08, 12.5]) assert.equal(isVanillaFullDraw(d), true, `${d}`);
  for (const d of [0, 4, 5.99, 12.51, 14, 20.18, Number.NaN]) assert.equal(isVanillaFullDraw(d), false, `${d}`);
});
