// Storm Blade damage arithmetic (spec §02, §05; L0-strm-rdmg, L0-adr-sbdm R and C) against the numbers BDS
// 1.26.51.1 gave: docs/feedback/diagnose-CNTR-X26.probe.txt (armour, toughness, Protection, the window) and
// docs/feedback/probe-storm.md P2 (Resistance, a natural-armour mob, a crit). The module runs with no engine:
// any runtime @minecraft import stays external and fails the load below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES_TS = join(projectRoot, 'src', 'storm', 'damage-rules.ts');

const bundle = await build({
  entryPoints: [RULES_TS],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const bundleText = bundle.outputFiles[0].text;
const rules = await import('data:text/javascript;base64,' + Buffer.from(bundleText, 'utf-8').toString('base64'));
const {
  ACTIVE_DAMAGE,
  PASSIVE_DAMAGE,
  HURT_WINDOW_TICKS,
  OVERKILL,
  NO_DEFENCE,
  afterArmour,
  resistanceFactor,
  planRaise,
  planStrike,
  windowWrite,
  inHurtWindow,
} = rules;

const BARE = NO_DEFENCE;
const DIAMOND = { armor: 20, toughness: 8, protection: 0, resistance: 0 };
const NETHERITE_P4 = { armor: 20, toughness: 12, protection: 16, resistance: 0 };
const withResistance = (d, level) => ({ ...d, resistance: level });
const r2 = (n) => Math.round(n * 100) / 100;
const near = (actual, expected, what) => assert.ok(Math.abs(actual - expected) <= 0.005 + 1e-9, `${what}: ${actual.toFixed(4)} vs measured ${expected.toFixed(2)}`);

test('the rules import nothing from the engine', () => {
  assert.doesNotMatch(bundleText, /@minecraft\//);
});

test('constants are the spec and the measured window', () => {
  assert.equal(ACTIVE_DAMAGE, 10);
  assert.equal(PASSIVE_DAMAGE, 6);
  assert.equal(HURT_WINDOW_TICKS, 10);
});

test('f is the identity on a bare target', () => {
  for (const d of [0.5, 6, 8, 10, 14, 18, 100]) assert.equal(afterArmour(d, BARE), d);
  assert.equal(afterArmour(0, DIAMOND), 0);
});

// [defence, raw d, measured post-armour, where]
const ARMOURED = [
  [DIAMOND, 6, 1.56, 'X26 txt:27 apply6'],
  [DIAMOND, 8, 2.24, 'X26 txt:26 melee'],
  [DIAMOND, 10, 3.0, 'X26 txt:125 apply10'],
  [DIAMOND, 14, 4.76, 'X26 txt:28 apply14'],
  [DIAMOND, 18, 6.84, 'X26 txt:126 apply18'],
  [DIAMOND, 24, 10.56, 'X26 raised 8.24 + apply24 2.32'],
  [DIAMOND, 12, 3.84, 'probe-storm P2 crit'],
  [NETHERITE_P4, 6, 0.54, 'X26 txt:46 apply6'],
  [NETHERITE_P4, 8, 0.76, 'X26 txt:45 melee'],
  [NETHERITE_P4, 14, 1.57, 'X26 txt:47 apply14'],
];

test('f reproduces the ten armoured hits to 0.01', () => {
  for (const [defence, d, measured, where] of ARMOURED) near(afterArmour(d, defence), measured, `${where} f(${d})`);
});

test('the A/5 floor: a husk with natural armour 2 (probe-storm P2)', () => {
  const husk = { armor: 2, toughness: 0, protection: 0, resistance: 0 };
  near(afterArmour(8, husk), 7.87, 'husk melee');
  near(afterArmour(6, husk), 5.9, 'husk apply6');
});

test('Resistance multiplies after armour: f(d)·(1 − 0.2·R) (probe-storm P2, ten rows)', () => {
  const bareMelee = [8.0, 6.4, 4.8, 3.2, 1.6];
  const bareApply6 = [6.0, 4.8, 3.6, 2.4, 1.2];
  const diamondMelee = [2.24, 1.79, 1.34, 0.9, 0.45];
  const diamondApply6 = [1.56, 1.25, 0.94, 0.62, 0.31];
  for (let level = 0; level <= 4; level++) {
    near(afterArmour(8, withResistance(BARE, level)), bareMelee[level], `bare R${level} melee`);
    near(afterArmour(6, withResistance(BARE, level)), bareApply6[level], `bare R${level} apply6`);
    near(afterArmour(8, withResistance(DIAMOND, level)), diamondMelee[level], `diamond R${level} melee`);
    near(afterArmour(6, withResistance(DIAMOND, level)), diamondApply6[level], `diamond R${level} apply6`);
  }
  // The other order, f(d·k), is what the measurement ruled out: melee + apply6 would be 2.88 / 2.04 / 1.28 / 0.60 on
  // diamond against the measured native sums 3.04 / 2.28 / 1.52 / 0.76.
  const nativeSum = [3.04, 2.28, 1.52, 0.76];
  const wrongOrder = [1, 2, 3, 4].map((level) => r2(afterArmour(8 * resistanceFactor(level), DIAMOND) + afterArmour(6 * resistanceFactor(level), DIAMOND)));
  assert.deepEqual(wrongOrder, [2.88, 2.04, 1.28, 0.6]);
  for (let level = 1; level <= 4; level++) {
    const sum = afterArmour(8, withResistance(DIAMOND, level)) + afterArmour(6, withResistance(DIAMOND, level));
    near(sum, nativeSum[level - 1], `diamond R${level} melee + apply6`);
    assert.notEqual(wrongOrder[level - 1], nativeSum[level - 1]);
  }
});

test('Resistance never turns damage negative', () => {
  for (const level of [5, 6, 10, 255]) {
    assert.equal(resistanceFactor(level), 0);
    assert.equal(afterArmour(10, withResistance(DIAMOND, level)), 0);
  }
  assert.equal(resistanceFactor(-1), 1);
});

test('passive raise: melee + f(6) is 14.00 / 3.80 / 1.30 in one hit (X26)', () => {
  for (const [defence, expected] of [[BARE, 14.0], [DIAMOND, 3.8], [NETHERITE_P4, 1.3]]) {
    const read = afterArmour(8, defence);
    const plan = planRaise(read, 40 - read, afterArmour(PASSIVE_DAMAGE, defence), false);
    assert.equal(plan.kind, 'raise');
    near(plan.damage, expected, `raise on A${defence.armor} P${defence.protection}`);
  }
});

test('negative control: a flat +6 raise is true damage, not damage before armour', () => {
  near(afterArmour(8, DIAMOND) + 6, 8.24, 'diamond flat');
  near(afterArmour(8, NETHERITE_P4) + 6, 6.76, 'netherite+P4 flat');
  assert.ok(afterArmour(8, DIAMOND) + 6 - (afterArmour(8, DIAMOND) + afterArmour(6, DIAMOND)) > 4);
});

test('negative control: difference-stacking (adr-sbdm A) is one L+D hit on armour, not +f(D)', () => {
  // f(14) − f(8) = 2.52 on diamond against the f(6) = 1.56 the spec asks for (X26 Q2).
  near(afterArmour(14, DIAMOND) - afterArmour(8, DIAMOND), 2.52, 'stacked difference');
  assert.ok(afterArmour(14, DIAMOND) - afterArmour(8, DIAMOND) > afterArmour(6, DIAMOND) + 0.9);
  // Bare, the two agree — which is why a bare target alone proves nothing about the formula.
  assert.equal(afterArmour(14, BARE) - afterArmour(8, BARE), afterArmour(6, BARE));
});

// Inside beforeEvents.entityHurt health already reads hp − read: an 8.00 hit on hp 10 shows 2.00 (STRM-DMG-01 run).
test('planRaise: a melee lethal by itself gets nothing, a raise that would be lethal is deferred', () => {
  assert.deepEqual(planRaise(8, 0, 6, false), { kind: 'kills-alone' });
  assert.deepEqual(planRaise(8, -3, 6, false), { kind: 'kills-alone' });
  assert.deepEqual(planRaise(8, 2, 6, false), { kind: 'lethal' });
  assert.deepEqual(planRaise(8, 6, 6, false), { kind: 'lethal' });
  assert.deepEqual(planRaise(8, 6.01, 6, false), { kind: 'raise', damage: 14 });
  const diamond = planRaise(2.24, 37.76, 1.56, false);
  assert.equal(diamond.kind, 'raise');
  near(diamond.damage, 3.8, 'diamond raise');
  // Health alone says nothing under absorption: the raise lands on absorption first.
  assert.deepEqual(planRaise(8, 2, 6, true), { kind: 'raise', damage: 14 });
  assert.deepEqual(planRaise(8, 0, 6, true), { kind: 'raise', damage: 14 });
});

test('planStrike: native out of a window, write inside one, overkill only when lethal in a window', () => {
  assert.equal(planStrike(40, 10, false, false), 'native');
  assert.equal(planStrike(5, 10, false, false), 'native');
  assert.equal(planStrike(40, 10, true, false), 'window');
  assert.equal(planStrike(10.01, 10, true, false), 'window');
  assert.equal(planStrike(10, 10, true, false), 'lethal');
  assert.equal(planStrike(3, 3, true, false), 'lethal');
  assert.equal(planStrike(3, 10, true, true), 'native');
  assert.equal(planStrike(40, 10, true, true), 'window');
});

test('windowWrite: the active nets f(10) inside a window, 10.00 bare and 3.00 in diamond (X26 C)', () => {
  // Bare, melee 8 landed at 40 → 32; applyDamage(10) in the window took 2.00.
  assert.equal(windowWrite(true, 32, 30, afterArmour(10, BARE)), 22);
  // Diamond, melee 2.24 at 40 → 37.76; applyDamage(10) took 0.76.
  near(37.76 - windowWrite(true, 37.76, 37.0, afterArmour(10, DIAMOND)), 3.0, 'diamond active in window');
  // After a raised melee the window swallowed it all.
  near(36.2 - windowWrite(true, 36.2, 36.2, afterArmour(10, DIAMOND)), 3.0, 'diamond active after a raised melee');
  // Nothing to write when the engine already took D′.
  assert.equal(windowWrite(true, 40, 30, 10), undefined);
  assert.equal(windowWrite(true, 40, 29, 10), undefined);
});

test('windowWrite: a shield that cancelled applyDamage is never written past', () => {
  assert.equal(windowWrite(false, 40, 40, 3), undefined);
  assert.equal(windowWrite(false, 32, 32, 10), undefined);
});

test('inHurtWindow: k = 1…9 inside, 10 and later out (X26 Q3)', () => {
  for (let k = 0; k <= 9; k++) assert.equal(inHurtWindow(100, 100 + k), true, `k=${k}`);
  for (const k of [10, 11, 50]) assert.equal(inHurtWindow(100, 100 + k), false, `k=${k}`);
  assert.equal(inHurtWindow(undefined, 100), false);
});

test('the overkill still kills through the strongest defence the formula knows', () => {
  const worst = { armor: 20, toughness: 12, protection: 16, resistance: 4 };
  // A target in the lethal path has hp ≤ f(10) < 10; the window it is in holds less than its max health.
  assert.ok(afterArmour(OVERKILL, worst) > 60, `f(${OVERKILL}) = ${afterArmour(OVERKILL, worst)}`);
  assert.ok(afterArmour(OVERKILL, DIAMOND) > 800);
});
