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

// ---------------------------------------------------------------- the helpers in damage.ts, on a stubbed engine
// The before-event's contract as BDS gave it: health already reads hp − read inside the handler (STRM-DMG-01 run), and
// a write to event.damage is the hit. The stub records applyDamage calls and the system.run queue.

const ENGINE_STUB = `
export const EntityComponentTypes = { Health: 'minecraft:health', Equippable: 'minecraft:equippable' };
export const ItemComponentTypes = { Enchantable: 'minecraft:enchantable' };
export const EntityDamageCause = { entityAttack: 'entityAttack', projectile: 'projectile', fall: 'fall', magic: 'magic' };
export const EquipmentSlot = { Head: 'Head', Chest: 'Chest', Legs: 'Legs', Feet: 'Feet', Mainhand: 'Mainhand' };
export const GameMode = { Survival: 'Survival', Creative: 'Creative', Spectator: 'Spectator' };
export class Player {}
const queue = [];
export const system = { currentTick: 1000, run(fn) { queue.push(fn); return queue.length; } };
export const world = { afterEvents: { entityHurt: { subscribe() {} } } };
export const engine = { queue, drain() { while (queue.length > 0) queue.shift()(); } };
`;

const engineStub = {
  name: 'engine-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: 'engine-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'engine-stub' }, () => ({ contents: ENGINE_STUB, loader: 'js' }));
  },
};

const helperBundle = await build({
  stdin: {
    contents: "export * from './src/storm/damage.ts'; export { engine } from '@minecraft/server';",
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [engineStub],
});
const helpers = await import('data:text/javascript;base64,' + Buffer.from(helperBundle.outputFiles[0].text, 'utf-8').toString('base64'));
const { engine } = helpers;

let entityCount = 0;
/** A living target as the helpers read it: health, equippable armour + Protection per slot, effects, applyDamage. */
function makeTarget({ hp, defence = BARE, absorbing = false, typeId = 'minecraft:cow' }) {
  const perSlot = defence.protection / 4;
  const piece = { getComponent: () => ({ getEnchantment: (id) => (id === 'protection' && perSlot > 0 ? { level: perSlot } : undefined) }) };
  const health = { currentValue: hp, setCurrentValue(v) { this.currentValue = v; return true; } };
  const equippable = { totalArmor: defence.armor, totalToughness: defence.toughness, getEquipment: () => piece };
  const effects = new Map();
  if (defence.resistance > 0) effects.set('resistance', { amplifier: defence.resistance - 1 });
  if (absorbing) effects.set('absorption', { amplifier: 0 });
  const target = {
    id: `-${++entityCount}`,
    typeId,
    isValid: true,
    health,
    applied: [],
    getComponent: (type) => (type === 'minecraft:health' ? health : type === 'minecraft:equippable' ? equippable : undefined),
    getEffect: (id) => effects.get(id),
    applyDamage(amount, options) {
      target.applied.push({ amount, options });
      return true;
    },
  };
  return target;
}

const shooter = { id: '-900', typeId: 'minecraft:player', isValid: true };

/** A hurt before-event of `read` on a target at `hp`: health already reads hp − read. `by: null` = no source. */
function hurt(target, read, { cause = 'projectile', by = shooter, cancel = false } = {}) {
  target.health.currentValue -= read;
  return { hurtEntity: target, damageSource: { cause, damagingEntity: by ?? undefined }, damage: read, cancel };
}

const quiet = (fn) => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
  }
};
const reports = [];
helpers.observeStorm((r) => reports.push(r));

// ---------------------------------------------------------------- raiseHit, pinned (AC2): additive, entityAttack only

test('raiseHit: the melee grows by f(6) in place — 14.00 / 3.80 / 1.30 (X26), the signature as it was', () => {
  assert.equal(typeof helpers.raiseHit, 'function');
  assert.equal(helpers.raiseHit.length, 1, 'raiseHit(event, damage = PASSIVE_DAMAGE)');
  for (const [defence, expected] of [[BARE, 14.0], [DIAMOND, 3.8], [NETHERITE_P4, 1.3]]) {
    const cow = makeTarget({ hp: 40, defence });
    const event = hurt(cow, afterArmour(8, defence), { cause: 'entityAttack' });
    const r = quiet(() => helpers.raiseHit(event));
    assert.equal(r.type, 'raise');
    assert.equal(r.plan, 'raise');
    near(event.damage, expected, `raised melee on A${defence.armor} P${defence.protection}`);
    assert.equal(r.set, event.damage);
    near(r.bonus, afterArmour(PASSIVE_DAMAGE, defence), 'bonus = f(6)');
    assert.equal(engine.queue.length, 0);
  }
});

test('raiseHit: a projectile, a cancelled hit and a sourceless hit are left alone', () => {
  for (const [opts, what] of [[{ cause: 'projectile' }, 'projectile'], [{ cause: 'entityAttack', cancel: true }, 'cancelled'], [{ cause: 'entityAttack', by: null }, 'no source']]) {
    const cow = makeTarget({ hp: 40 });
    const event = hurt(cow, 9, opts);
    const r = quiet(() => helpers.raiseHit(event, 14));
    assert.equal(r.plan, 'none', what);
    assert.equal(event.damage, 9, what);
    assert.equal(r.set, undefined, what);
  }
});

test('raiseHit: a lethal raise leaves the hit and follows through; a melee that kills alone gets nothing', () => {
  const cow = makeTarget({ hp: 10 });
  const event = hurt(cow, 8, { cause: 'entityAttack' });
  const r = quiet(() => helpers.raiseHit(event));
  assert.equal(r.plan, 'lethal');
  assert.equal(event.damage, 8, 'the hit is not rewritten');
  assert.equal(engine.queue.length, 1);
  quiet(() => engine.drain());
  assert.deepEqual(cow.applied, [{ amount: 2 + helpers.OVERKILL, options: { cause: 'entityAttack', damagingEntity: shooter } }]);
  const lone = makeTarget({ hp: 6 });
  const alone = hurt(lone, 8, { cause: 'entityAttack' });
  assert.equal(quiet(() => helpers.raiseHit(alone)).plan, 'kills-alone');
  assert.equal(alone.damage, 8);
  assert.equal(engine.queue.length, 0);
});

// ---------------------------------------------------------------- setHit (AC1): replace, not add, on the causes given

test('setHit: the hit becomes f(14) after armour — 14.00 / 4.76 / 1.57, whatever the arrow read', () => {
  assert.equal(typeof helpers.setHit, 'function', 'setHit is exported from src/storm/damage.ts');
  // f(14) on diamond and netherite + P4 is what applyDamage(14) took on BDS (X26 txt:28, txt:47).
  for (const [defence, expected] of [[BARE, 14.0], [DIAMOND, 4.76], [NETHERITE_P4, 1.57]]) {
    for (const read of [afterArmour(3, defence), afterArmour(9, defence), afterArmour(25, defence)]) {
      const target = makeTarget({ hp: 40, defence });
      const event = hurt(target, read);
      const r = quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
      assert.equal(r.type, 'set');
      assert.equal(r.plan, 'set', `read ${read}`);
      near(event.damage, expected, `set on A${defence.armor} P${defence.protection} over a read of ${read.toFixed(2)}`);
      near(event.damage, afterArmour(14, defence), 'event.damage = afterArmour(preArmour)');
      assert.equal(r.set, event.damage);
      assert.equal(r.read, read);
      assert.equal(r.goal, event.damage);
      assert.deepEqual(r.defence, defence);
      assert.equal(engine.queue.length, 0);
    }
  }
});

test('negative control: the additive raise of the same arrow is vanilla + 14, not 14 (CX-uwbw-01)', () => {
  const target = makeTarget({ hp: 40 });
  const event = hurt(target, 9, { cause: 'entityAttack' });
  quiet(() => helpers.raiseHit(event, 14));
  assert.equal(event.damage, 23);
  const armed = makeTarget({ hp: 40 });
  const set = hurt(armed, 9);
  quiet(() => helpers.setHit(set, 14, { causes: ['projectile'] }));
  assert.equal(set.damage, 14);
});

test('setHit: Resistance counts — f(14)·(1 − 0.2·R)', () => {
  for (let level = 1; level <= 4; level++) {
    const target = makeTarget({ hp: 40, defence: withResistance(BARE, level) });
    const event = hurt(target, 5);
    quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
    near(event.damage, 14 * (1 - 0.2 * level), `R${level}`);
  }
});

test('setHit: only the causes it is given; anything else keeps its damage', () => {
  const cases = [
    [['projectile'], 'entityAttack', 'none'],
    [['projectile'], 'fall', 'none'],
    [['entityAttack'], 'projectile', 'none'],
    [[], 'projectile', 'none'],
    [['entityAttack', 'projectile'], 'projectile', 'set'],
    [['entityAttack', 'projectile'], 'entityAttack', 'set'],
  ];
  for (const [causes, cause, plan] of cases) {
    const target = makeTarget({ hp: 40 });
    const event = hurt(target, 9, { cause });
    const r = quiet(() => helpers.setHit(event, 14, { causes }));
    assert.equal(r.plan, plan, `${cause} with causes [${causes}]`);
    assert.equal(event.damage, plan === 'none' ? 9 : 14, `${cause} with causes [${causes}]`);
  }
});

test('setHit: a cancelled hit and a target with no health are never set', () => {
  const target = makeTarget({ hp: 40 });
  const cancelled = hurt(target, 9, { cancel: true });
  assert.equal(quiet(() => helpers.setHit(cancelled, 14, { causes: ['projectile'] })).plan, 'none');
  assert.equal(cancelled.damage, 9);
  const stand = makeTarget({ hp: 40, typeId: 'minecraft:armor_stand' });
  stand.getComponent = () => undefined;
  const lifeless = hurt(stand, 9);
  assert.equal(quiet(() => helpers.setHit(lifeless, 14, { causes: ['projectile'] })).plan, 'none');
  assert.equal(lifeless.damage, 9);
});

test('setHit: lethal is judged on the health before the hit (hp left + read), not on the health left', () => {
  // hp 20, an arrow of 9: the event reads 11 left, yet 14 instead of 9 leaves 6.
  const target = makeTarget({ hp: 20 });
  const event = hurt(target, 9);
  const r = quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
  assert.equal(r.plan, 'set');
  assert.equal(event.damage, 14);
  assert.equal(engine.queue.length, 0);
});

test('setHit: a lethal 14 writes 0 and follows through with an overkill entityAttack from the shooter', () => {
  const target = makeTarget({ hp: 10 });
  const event = hurt(target, 3);
  const r = quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
  assert.equal(r.plan, 'lethal');
  assert.equal(event.damage, 0, 'a lethal rewrite eats the totem (probe-storm P3): the hit deals nothing');
  assert.equal(r.set, 0);
  assert.equal(target.applied.length, 0, 'a before-event applies no damage');
  assert.equal(engine.queue.length, 1);
  target.health.currentValue = 10;
  reports.length = 0;
  quiet(() => engine.drain());
  assert.deepEqual(target.applied, [{ amount: 10 + helpers.OVERKILL, options: { cause: 'entityAttack', damagingEntity: shooter } }]);
  const strike = reports.find((x) => x.type === 'strike');
  assert.equal(strike?.from, 'set');
  assert.equal(strike?.path, 'lethal');
  // Exactly at the health before the hit is lethal too.
  const edge = makeTarget({ hp: 14 });
  const atEdge = hurt(edge, 4);
  assert.equal(quiet(() => helpers.setHit(atEdge, 14, { causes: ['projectile'] })).plan, 'lethal');
  assert.equal(atEdge.damage, 0);
  quiet(() => engine.drain());
});

test('setHit: a hit that kills alone and a 14 that kills too — the engine keeps its own hit', () => {
  const target = makeTarget({ hp: 8 });
  const event = hurt(target, 9);
  const r = quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
  assert.equal(r.plan, 'kills-alone');
  assert.equal(event.damage, 9);
  assert.equal(r.set, undefined);
  assert.equal(engine.queue.length, 0);
});

test('setHit: a vanilla hit that would kill alone is lowered when f(14) does not kill', () => {
  // Diamond, hp 4, an arrow of 25 raw: f(25) kills, f(14) = 4.76 kills, f(14) on hp 5 does not.
  const target = makeTarget({ hp: 5, defence: DIAMOND });
  const event = hurt(target, afterArmour(25, DIAMOND));
  const r = quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
  assert.equal(r.plan, 'set');
  near(event.damage, 4.76, 'lowered to f(14)');
});

test('setHit: under absorption the health check means nothing — the set is taken, as with the raise', () => {
  const target = makeTarget({ hp: 4, absorbing: true });
  const event = hurt(target, 3);
  const r = quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
  assert.equal(r.plan, 'set');
  assert.equal(event.damage, 14);
  assert.equal(engine.queue.length, 0);
});

test('setHit: a hit with no damaging entity is still set; its lethal overkill carries no source', () => {
  const target = makeTarget({ hp: 40 });
  const event = hurt(target, 9, { by: null });
  assert.equal(quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] })).plan, 'set');
  assert.equal(event.damage, 14);
  const low = makeTarget({ hp: 5 });
  const lethal = hurt(low, 2, { by: null });
  assert.equal(quiet(() => helpers.setHit(lethal, 14, { causes: ['projectile'] })).plan, 'lethal');
  low.health.currentValue = 5;
  quiet(() => engine.drain());
  assert.deepEqual(low.applied, [{ amount: 5 + helpers.OVERKILL, options: { cause: 'entityAttack' } }]);
});

test('setHit reports to the Storm observers like the raise does', () => {
  reports.length = 0;
  const target = makeTarget({ hp: 40, defence: DIAMOND });
  const event = hurt(target, 2.6);
  const r = quiet(() => helpers.setHit(event, 14, { causes: ['projectile'] }));
  assert.deepEqual(reports, [r]);
  assert.equal(r.damage, 14);
  assert.equal(r.wielderId, shooter.id);
  assert.equal(r.targetId, target.id);
});

test('planSet: replace, lethal on the health before the hit, kills-alone only when both kill', () => {
  const { planSet } = rules;
  assert.equal(typeof planSet, 'function', 'planSet is exported from src/storm/damage-rules.ts');
  assert.deepEqual(planSet(9, 31, 14, false), { kind: 'set', damage: 14 });
  assert.deepEqual(planSet(20, 20, 14, false), { kind: 'set', damage: 14 });
  assert.deepEqual(planSet(9, 11, 14, false), { kind: 'set', damage: 14 });
  assert.deepEqual(planSet(9, 5, 14, false), { kind: 'lethal' });
  assert.deepEqual(planSet(4, 10, 14, false), { kind: 'lethal' });
  assert.deepEqual(planSet(9, 0, 14, false), { kind: 'kills-alone' });
  assert.deepEqual(planSet(9, -1, 14, false), { kind: 'kills-alone' });
  assert.deepEqual(planSet(9, -1, 4.76, false), { kind: 'set', damage: 4.76 });
  assert.deepEqual(planSet(9, 0, 14, true), { kind: 'set', damage: 14 });
  assert.deepEqual(planSet(3, 1, 14, true), { kind: 'set', damage: 14 });
});
