// Above-Water Trident movement rules (spec §02 items 2–3; L0-trdt-pmov, L0-adr-twrp): the release
// decision, the dash impulse, the one-shot fall grant and the swim kick, plus every calibration number
// read back out of docs/feedback/probe-trident.md at the section its comment cites. The module runs
// with no engine: any runtime @minecraft import stays external and fails the load below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES_TS = join(projectRoot, 'src', 'trident', 'movement-rules.ts');
const read = (...parts) => readFileSync(join(projectRoot, ...parts), 'utf-8');

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
  USE_TICKS,
  MIN_CHARGE_TICKS,
  DASH_H,
  DASH_V,
  RIPTIDE_SPEED,
  RIPTIDE_LANDING,
  DASH_TOLERANCE,
  GRANT_TICKS,
  STALE_TICKS,
  CONTACT_TICKS,
  SWIM_BASE_BPS,
  SWIM_TARGET_BPS,
  SWIM_KICK,
  SWIM_CAP_BPT,
  chargeTicks,
  releaseDecision,
  dashImpulse,
  newGrant,
  grantLive,
  stepGrant,
  swimKick,
} = rules;

const source = read('src', 'trident', 'movement-rules.ts');
const probe = read('docs', 'feedback', 'probe-trident.md');

/** The body of the probe report's section `## <n>.`, up to the next `## `. */
function probeSection(n) {
  const start = probe.indexOf(`\n## ${n}. `);
  assert.ok(start >= 0, `docs/feedback/probe-trident.md has no section ${n}`);
  const end = probe.indexOf('\n## ', start + 1);
  return probe.slice(start, end < 0 ? undefined : end);
}

/** The doc comment right above `export const <name>`. */
function commentOf(name) {
  const at = source.search(new RegExp(`export const ${name}[ :]`));
  assert.ok(at >= 0, `movement-rules.ts exports no ${name}`);
  const before = source.slice(0, at).trimEnd();
  assert.ok(before.endsWith('*/'), `${name} has no doc comment`);
  return before.slice(before.lastIndexOf('/**'));
}

const pitchView = (pitch, yaw = -90) => {
  const p = (pitch * Math.PI) / 180;
  const y = (yaw * Math.PI) / 180;
  return { x: -Math.sin(y) * Math.cos(p), y: -Math.sin(p), z: Math.cos(y) * Math.cos(p) };
};

// ------------------------------------------------------------------ AC#7: the numbers and where they come from

test('every calibration number cites its probe section, and that section carries it', () => {
  const cases = [
    // [constant, section, value, text the section must contain]
    ['USE_TICKS', 3, USE_TICKS, '72000 − `useDuration`'],
    ['DASH_H', 4, DASH_H, '**H = 3.00 / 0.400 = 7.50**'],
    ['DASH_V', 4, DASH_V, '**V = 3.00 / 1.000 = 3.00**'],
    ['RIPTIDE_SPEED', 4, RIPTIDE_SPEED, 'Тягун III даёт 3.00 б/т'],
    ['SWIM_BASE_BPS', 6, SWIM_BASE_BPS, '| вода, `swim()` + спринт (спринт вплавь) | **3.87** |'],
    ['SWIM_TARGET_BPS', 6, SWIM_TARGET_BPS, '| суша, бег (`isSprinting`) | **5.61** |'],
    ['SWIM_KICK', 6, SWIM_KICK, '| вода, спринт вплавь + 0.34/тик | **5.66** |'],
  ];
  for (const [name, section, value, text] of cases) {
    assert.match(commentOf(name), new RegExp(`probe §${section}\\b`), `${name} does not cite probe §${section}`);
    assert.ok(probeSection(section).includes(text), `probe §${section} does not carry "${text}" for ${name} = ${value}`);
  }
  assert.equal(USE_TICKS, 72000);
  assert.equal(DASH_H, 7.5);
  assert.equal(DASH_V, 3.0);
  assert.equal(SWIM_KICK, 0.34);
});

test('the Riptide III landing distances are the probe §4 rain rows', () => {
  assert.match(commentOf('RIPTIDE_LANDING'), /probe §4\b/);
  const s4 = probeSection(4);
  assert.deepEqual([...RIPTIDE_LANDING.keys()].sort((a, b) => a - b), [-45, -30]);
  for (const [pitch, landing] of RIPTIDE_LANDING) {
    const row = s4.split('\n').find((l) => l.startsWith(`| дождь | −${-pitch}° |`));
    assert.ok(row !== undefined, `probe §4 has no rain row for pitch ${pitch}`);
    assert.ok(row.includes(`**${landing.toFixed(2)}**`), `the rain row for ${pitch} does not land at ${landing}: ${row}`);
  }
  assert.equal(DASH_TOLERANCE, 0.2);
});

test('the charge length matches the item: use_duration × 20 ticks', () => {
  const item = JSON.parse(read('packs', 'behavior', 'items', 'above_water_trident.json'))['minecraft:item'];
  assert.equal(item.components['minecraft:use_modifiers'].use_duration * 20, USE_TICKS);
});

test('the grant reuses the katana timings: FALL_FLAG_MS and STALE_TICKS of src/katana/fall.ts', () => {
  const katana = read('src', 'katana', 'fall.ts');
  const ms = Number(/export const FALL_FLAG_MS = ([\d_]+);/.exec(katana)?.[1].replace(/_/g, ''));
  const stale = Number(/const STALE_TICKS = (\d+);/.exec(katana)?.[1]);
  assert.equal(GRANT_TICKS * 50, ms);
  assert.equal(STALE_TICKS, stale);
});

// ------------------------------------------------------------------ release

test('the charge is the full duration minus what is left', () => {
  assert.equal(chargeTicks(71980), 20);
  assert.equal(chargeTicks(71995), 5);
  assert.equal(chargeTicks(71960), 40);
  assert.equal(chargeTicks(72000), 0);
  assert.equal(chargeTicks(72500), 0);
});

test('a sneaking release dashes, a plain one throws, a short or foreign one does nothing', () => {
  const at = (charge, sneaking, trident = true) => releaseDecision({ trident, sneaking, charge });
  assert.equal(MIN_CHARGE_TICKS, 10);
  assert.equal(at(10, true), 'dash');
  assert.equal(at(20, true), 'dash');
  assert.equal(at(10, false), 'throw');
  assert.equal(at(9, true), 'none');
  assert.equal(at(5, false), 'none');
  assert.equal(at(0, true), 'none');
  assert.equal(at(40, true, false), 'none');
});

// ------------------------------------------------------------------ dash

test('a dash launches at Riptide III speed along the view at any pitch', () => {
  // probe §4: one unit of horizontal knockback = 0.400 b/t, of vertical = 1.000 b/t.
  for (const pitch of [0, -30, -45, -90, 30]) {
    const v = pitchView(pitch);
    const { horizontal, vertical } = dashImpulse(v);
    const h = Math.hypot(horizontal.x, horizontal.z) * 0.4;
    const speed = Math.hypot(h, vertical * 1.0);
    assert.ok(Math.abs(speed - RIPTIDE_SPEED) < 1e-9, `pitch ${pitch}: ${speed} b/t`);
    assert.ok(Math.abs(Math.sign(vertical) - Math.sign(v.y)) < 1e-9 || Math.abs(v.y) < 1e-9);
    if (Math.hypot(v.x, v.z) > 1e-9) {
      const dot = (horizontal.x * v.x + horizontal.z * v.z) / (Math.hypot(horizontal.x, horizontal.z) * Math.hypot(v.x, v.z));
      assert.ok(dot > 0.999999, `pitch ${pitch}: the push leaves the view`);
    }
  }
});

// ------------------------------------------------------------------ fall grant

test('a grant ignores contact in its stale ticks and ends after two ticks of contact', () => {
  let g = newGrant(100);
  for (let t = 101; t <= 100 + STALE_TICKS; t++) {
    const s = stepGrant(g, { tick: t, contact: true });
    assert.equal(s.end, undefined, `tick ${t} ended the grant on take-off contact`);
    g = s.grant;
  }
  let t = 100 + STALE_TICKS + 1;
  for (; t < 140; t++) {
    const s = stepGrant(g, { tick: t, contact: false });
    assert.equal(s.end, undefined);
    g = s.grant;
  }
  const first = stepGrant(g, { tick: t, contact: true });
  assert.equal(first.end, undefined, 'the first contact tick must leave the landing hurt its grant');
  const second = stepGrant(first.grant, { tick: t + 1, contact: true });
  assert.equal(CONTACT_TICKS, 2);
  assert.equal(second.end, 'landed');
});

test('a single contact tick between airborne ticks keeps the grant', () => {
  let g = newGrant(0);
  const seq = [false, false, false, true, false, false, true, false];
  seq.forEach((contact, i) => {
    const s = stepGrant(g, { tick: i + 1, contact });
    assert.equal(s.end, undefined, `tick ${i + 1}`);
    g = s.grant;
  });
});

test('an unused grant expires after the katana flag time and not before', () => {
  const g = newGrant(1000);
  assert.ok(grantLive(g, 1000 + GRANT_TICKS));
  assert.ok(!grantLive(g, 1001 + GRANT_TICKS));
  assert.equal(stepGrant(g, { tick: 1000 + GRANT_TICKS, contact: false }).end, undefined);
  assert.equal(stepGrant(g, { tick: 1001 + GRANT_TICKS, contact: false }).end, 'expired');
  assert.equal(stepGrant(g, { tick: 1001 + GRANT_TICKS, contact: true }).end, 'expired');
});

test('a second dash replaces the grant instead of stacking it', () => {
  const a = newGrant(0);
  const b = newGrant(150);
  assert.equal(b.expiresTick, 150 + GRANT_TICKS);
  assert.equal(b.contactTicks, 0);
  assert.ok(b.expiresTick > a.expiresTick);
});

// ------------------------------------------------------------------ swim kick

const swimmer = (over = {}) => ({
  holding: true,
  inWater: true,
  swimming: true,
  velocity: { x: 0.19, y: 0, z: 0 },
  view: { x: 1, y: 0, z: 0 },
  ...over,
});

test('a held trident kicks a sprint-swimmer along the horizontal view with the probe §6 strength', () => {
  const k = swimKick(swimmer({ view: { x: 0.6, y: -0.6, z: 0.529 } }));
  assert.ok(k !== undefined);
  assert.ok(Math.abs(Math.hypot(k.x, k.z) - SWIM_KICK) < 1e-9);
  assert.ok(Math.abs(k.x / k.z - 0.6 / 0.529) < 1e-9);
});

test('no kick without the trident in a hand or outside water', () => {
  assert.equal(swimKick(swimmer({ holding: false })), undefined);
  assert.equal(swimKick(swimmer({ inWater: false })), undefined);
});

test('the kick stops at target + 15 %, above the speed it holds', () => {
  assert.ok(Math.abs(SWIM_CAP_BPT - (SWIM_TARGET_BPS * 1.15) / 20) < 1e-12);
  // probe §6: 0.34/tick holds 5.66 b/s; a cap under that would cut the kick it was calibrated with.
  assert.ok(5.66 / 20 < SWIM_CAP_BPT);
  assert.ok(swimKick(swimmer({ velocity: { x: 5.66 / 20, y: 0, z: 0 } })) !== undefined);
  assert.equal(swimKick(swimmer({ velocity: { x: SWIM_CAP_BPT, y: 0, z: 0 } })), undefined);
  // A dash out of the water leaves at 3 b/t: the boost must not brake it.
  assert.equal(swimKick(swimmer({ velocity: { x: 2.6, y: 1.5, z: 0 } })), undefined);
});

test('a swimmer who is not sprint-swimming is kicked only while moving forward', () => {
  assert.equal(swimKick(swimmer({ swimming: false, velocity: { x: 0, y: 0, z: 0 } })), undefined);
  assert.equal(swimKick(swimmer({ swimming: false, velocity: { x: -0.1, y: 0, z: 0 } })), undefined);
  assert.equal(swimKick(swimmer({ swimming: false, velocity: { x: 0, y: 0, z: 0.1 } })), undefined);
  assert.ok(swimKick(swimmer({ swimming: false, velocity: { x: 0.1, y: 0, z: 0 } })) !== undefined);
});

test('looking straight up or down gives no horizontal direction to kick along', () => {
  assert.equal(swimKick(swimmer({ view: { x: 0, y: -1, z: 0 } })), undefined);
  assert.equal(swimKick(swimmer({ view: { x: 0.0001, y: 1, z: 0 } })), undefined);
});

test('the target is the land sprint, well above the sprint-swim base', () => {
  assert.ok(SWIM_TARGET_BPS / SWIM_BASE_BPS > 1.15 * 1.1, 'base and target windows must not overlap');
});

// ------------------------------------------------------------------ wiring

test('both packs arm the movement module', () => {
  assert.match(read('src', 'main.ts'), /^registerTridentMovement\(\);$/m);
  assert.match(read('src', 'gametest', 'trident-movement.ts'), /^registerTridentMovement\(\);$/m);
  assert.match(read('src', 'gametest', 'main.ts'), /^import "\.\/trident-movement";$/m);
});
