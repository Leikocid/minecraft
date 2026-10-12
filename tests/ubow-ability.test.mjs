// The Underwater Bow's armed charge (spec v3 §1; L0-xcx33, L0-xasm38, L0-uwbw-parm, L0-uwbw-phit, R-uwbw-001,
// R-uwbw-003): src/ubow/ability-rules.ts under node, the HUD's third state through src/legendary/hud.ts with the engine
// stubbed, Projectile Protection in the storm defence arithmetic against probe-ubow row 5, and the static half of the
// split between the rules and src/ubow/ability.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => readFileSync(join(projectRoot, ...parts), 'utf-8');
const load = async (options) => {
  const out = await build({ bundle: true, format: 'esm', platform: 'neutral', write: false, ...options });
  return import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text, 'utf-8').toString('base64'));
};

// Any runtime @minecraft import in the rules stays external and fails this load.
const rules = await load({ entryPoints: [join(projectRoot, 'src', 'ubow', 'ability-rules.ts')], external: ['@minecraft/*'] });
const storm = await load({ entryPoints: [join(projectRoot, 'src', 'storm', 'damage-rules.ts')], external: ['@minecraft/*'] });
const {
  ARMED_DAMAGE,
  ARMED_COOLDOWN_TICKS,
  ARMED_ARROW_TICKS,
  LANDING_TICKS,
  REFUSAL_HINT_TICKS,
  armedKey,
  playerOfKey,
  isCharge,
  armDecision,
  chargeState,
  ArmedShotBook,
  armedHitSkip,
  landedHit,
  LandingBook,
} = rules;
const { afterArmour, PROJECTILE_PROTECTION_EPF, NO_DEFENCE } = storm;

const mcStub = {
  name: 'minecraft-server-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: '@minecraft/server', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      contents: [
        'export const world = { getDynamicProperty() {} };',
        'export const system = { runInterval() {} };',
        'export const EntityComponentTypes = { Equippable: "minecraft:equippable" };',
        'export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };',
      ].join('\n'),
      loader: 'js',
    }));
  },
};
const hud = await load({
  stdin: {
    contents: [
      "export { hudMessage, registerArmedState } from './src/legendary/hud.ts';",
      "export { startCooldown, clearCooldown } from './src/legendary/cooldown.ts';",
      "export { UNDERWATER_BOW, STORM_BLADE } from './src/legendary/registry.ts';",
    ].join('\n'),
    resolveDir: projectRoot,
    loader: 'ts',
  },
  plugins: [mcStub],
});

const ARM = { bowInMainHand: true, sneaking: true, armed: false, cooldownMs: 0 };

test('constants: 14 before armour, the registry 600-tick cooldown', () => {
  assert.strictEqual(ARMED_DAMAGE, 14);
  assert.strictEqual(ARMED_COOLDOWN_TICKS, 600);
  assert.strictEqual(LANDING_TICKS, 2);
  assert.ok(ARMED_ARROW_TICKS >= 200, 'an armed arrow lives long enough for any real flight');
  assert.ok(REFUSAL_HINT_TICKS > 0);
});

test('the charge ledger: one world key per player id, only true is a charge', () => {
  assert.strictEqual(armedKey('-4294967295'), 'andrew:ub_armed:-4294967295');
  assert.strictEqual(playerOfKey(armedKey('abc')), 'abc');
  assert.strictEqual(playerOfKey('andrew:ub_armed:'), undefined);
  assert.strictEqual(playerOfKey('andrew:cd_underwater_bow'), undefined);
  assert.notStrictEqual(armedKey('a'), armedKey('b'));
  assert.ok(armedKey('x').startsWith('andrew:ub_'), 'the bow keeps its own ub namespace');
  for (const [raw, want] of [[true, true], [false, false], [undefined, false], [1, false], ['true', false]]) {
    assert.strictEqual(isCharge(raw), want, `isCharge(${String(raw)})`);
  }
});

test('armDecision: sneak + Use arms, a plain Use never does (L0-xcx33)', async (t) => {
  await t.test('sneaking, ready, not armed: arm', () => assert.strictEqual(armDecision(ARM), 'arm'));
  await t.test('not sneaking: a plain draw, armed or not, ready or not', () => {
    for (const armed of [false, true]) for (const cooldownMs of [0, 12_000]) assert.strictEqual(armDecision({ ...ARM, sneaking: false, armed, cooldownMs }), 'plain');
  });
  await t.test('already armed: nothing', () => assert.strictEqual(armDecision({ ...ARM, armed: true }), 'already'));
  await t.test('during the cooldown: refused, even one millisecond before it ends', () => {
    assert.strictEqual(armDecision({ ...ARM, cooldownMs: 30_000 }), 'refused');
    assert.strictEqual(armDecision({ ...ARM, cooldownMs: 1 }), 'refused');
    assert.strictEqual(armDecision({ ...ARM, cooldownMs: 0 }), 'arm');
  });
  await t.test('no live bow in the main hand: not the bow press, whatever else holds', () => {
    for (const sneaking of [false, true]) assert.strictEqual(armDecision({ ...ARM, bowInMainHand: false, sneaking }), 'not-bow');
  });
});

test('chargeState: the three HUD states, the cooldown first', () => {
  assert.strictEqual(chargeState(false, 0), 'ready');
  assert.strictEqual(chargeState(true, 0), 'armed');
  assert.strictEqual(chargeState(false, 5_000), 'cooldown');
  assert.strictEqual(chargeState(true, 5_000), 'cooldown');
});

test('ArmedShotBook: only the first arrow after arming carries the charge (L0-uwbw-earm)', async (t) => {
  await t.test('not armed: no arrow is marked', () => {
    const book = new ArmedShotBook();
    assert.strictEqual(book.marks('p', false, 0), false);
  });
  await t.test('armed: the first arrow is marked, the next one is plain while the first flies', () => {
    const book = new ArmedShotBook();
    assert.strictEqual(book.marks('p', true, 0), true);
    book.mark('a1', 'p', 0);
    assert.strictEqual(book.shooterOf('a1'), 'p');
    assert.strictEqual(book.pendingOf('p'), 'a1');
    assert.strictEqual(book.marks('p', true, 5), false);
    assert.strictEqual(book.shooterOf('a2'), undefined);
    assert.strictEqual(book.shooterOf(undefined), undefined);
  });
  await t.test('a resolved arrow frees its shooter: the next arrow carries the charge again', () => {
    const book = new ArmedShotBook();
    book.mark('a1', 'p', 0);
    assert.strictEqual(book.resolve('a1'), 'p');
    assert.strictEqual(book.resolve('a1'), undefined, 'resolving twice does nothing');
    assert.strictEqual(book.pendingOf('p'), undefined);
    assert.strictEqual(book.marks('p', true, 10), true);
    assert.strictEqual(book.size, 0);
  });
  await t.test('two shooters are independent', () => {
    const book = new ArmedShotBook();
    book.mark('a1', 'p', 0);
    assert.strictEqual(book.marks('q', true, 0), true);
    book.mark('b1', 'q', 0);
    book.resolve('a1');
    assert.strictEqual(book.pendingOf('q'), 'b1');
  });
  await t.test('an unresolved arrow expires after ARMED_ARROW_TICKS and frees its shooter', () => {
    const book = new ArmedShotBook();
    book.mark('a1', 'p', 100);
    assert.deepStrictEqual(book.sweep(100 + ARMED_ARROW_TICKS), []);
    assert.deepStrictEqual(book.sweep(101 + ARMED_ARROW_TICKS), ['a1']);
    assert.strictEqual(book.marks('p', true, 101 + ARMED_ARROW_TICKS), true);
  });
});

test('armedHitSkip: what the before-event may rewrite (R-uwbw-001)', async (t) => {
  const HIT = { cause: 'projectile', armedShot: true, self: false, living: () => true, cancelled: false, read: 6.2 };
  await t.test('an armed arrow landing on a living target with damage is rewritten', () => assert.strictEqual(armedHitSkip(HIT), undefined));
  await t.test('each miss keeps the charge, for its own reason', () => {
    assert.strictEqual(armedHitSkip({ ...HIT, cause: 'entityAttack' }), 'cause');
    assert.strictEqual(armedHitSkip({ ...HIT, armedShot: false }), 'not-armed');
    assert.strictEqual(armedHitSkip({ ...HIT, self: true }), 'self');
    assert.strictEqual(armedHitSkip({ ...HIT, cancelled: true }), 'cancelled');
    assert.strictEqual(armedHitSkip({ ...HIT, read: 0 }), 'no-damage');
    assert.strictEqual(armedHitSkip({ ...HIT, read: Number.NaN }), 'no-damage');
    assert.strictEqual(armedHitSkip({ ...HIT, living: () => false }), 'not-living');
  });
  await t.test('the living check is not read for a hit already turned away', () => {
    let asked = 0;
    armedHitSkip({ ...HIT, self: true, living: () => (asked++, true) });
    assert.strictEqual(asked, 0);
  });
});

test('landedHit: a set hit must land; a lethal one is zeroed and lands through its overkill', () => {
  assert.strictEqual(landedHit('set', 14), true);
  assert.strictEqual(landedHit('set', 0), false, 'swallowed by the hurt window');
  assert.strictEqual(landedHit('set', undefined), false, 'no after-event: cancelled');
  assert.strictEqual(landedHit('kills-alone', 6.4), true);
  assert.strictEqual(landedHit('kills-alone', undefined), false);
  assert.strictEqual(landedHit('lethal', 0), true);
  assert.strictEqual(landedHit('lethal', undefined), true);
  assert.strictEqual(landedHit('none', 14), false);
});

test('LandingBook: an after-event takes the pairing within LANDING_TICKS, once', () => {
  const book = new LandingBook();
  const a = { arrowId: 'a1' };
  book.expect('t', 10, a);
  assert.strictEqual(book.has((d) => d.arrowId === 'a1'), true);
  assert.strictEqual(book.take('t', 10 + LANDING_TICKS), a);
  assert.strictEqual(book.take('t', 10 + LANDING_TICKS), undefined);
  book.expect('t', 10, a);
  assert.strictEqual(book.take('t', 11 + LANDING_TICKS), undefined, 'too late: not this hit');
  assert.strictEqual(book.size, 0);
  const b = { arrowId: 'b1' };
  book.expect('t', 20, a);
  book.expect('t', 21, b);
  assert.strictEqual(book.takeIf('t', a), false, 'a later hit on the same target replaced it');
  assert.strictEqual(book.takeIf('t', b), true);
  assert.strictEqual(book.takeIf('t', b), false);
});

test('exactly 14 before armour, Projectile Protection included (probe-ubow row 5)', async (t) => {
  const bare = NO_DEFENCE;
  const iron = { armor: 15, toughness: 0, protection: 0, resistance: 0 };
  const diamondProt4 = { armor: 20, toughness: 8, protection: 16, resistance: 0 };
  const diamondProjProt4 = { armor: 20, toughness: 8, protection: 4 * 4 * PROJECTILE_PROTECTION_EPF, resistance: 0 };
  await t.test('the readings setHit wrote on BDS', () => {
    assert.strictEqual(afterArmour(ARMED_DAMAGE, bare), 14);
    assert.strictEqual(afterArmour(ARMED_DAMAGE, iron).toFixed(2), '9.52');
    assert.strictEqual(afterArmour(ARMED_DAMAGE, diamondProt4).toFixed(2), '1.71');
  });
  await t.test('Projectile Protection IV ×4 reaches the EPF cap: the vanilla arrow read 0.312 = f(6) × 0.2', () => {
    assert.strictEqual(PROJECTILE_PROTECTION_EPF, 2);
    assert.strictEqual(afterArmour(6, diamondProjProt4).toFixed(3), '0.312');
    assert.strictEqual(afterArmour(6, { ...diamondProjProt4, protection: 0 }).toFixed(3), '1.560', 'without it: the 4.76 setHit wrote');
    assert.strictEqual(afterArmour(ARMED_DAMAGE, diamondProjProt4).toFixed(3), '0.952');
  });
});

test('hudMessage: ready, armed, cooldown for the bow (L0-uwbw-earm)', async (t) => {
  const { hudMessage, registerArmedState, startCooldown, clearCooldown, UNDERWATER_BOW, STORM_BLADE } = hud;
  Date.now = () => globalThis.__ubNow ?? 0;
  const stack = (typeId) => ({ typeId, getDynamicProperty: () => undefined });
  const player = (main, off) => {
    const props = new Map();
    const hands = { Mainhand: main, Offhand: off };
    return {
      id: 'p1',
      getDynamicProperty: (k) => props.get(k),
      setDynamicProperty: (k, v) => (v === undefined ? props.delete(k) : props.set(k, v)),
      getComponent: (id) => (id === 'minecraft:equippable' ? { getEquipment: (slot) => hands[slot] } : undefined),
    };
  };
  const name = { translate: 'item.andrew:underwater_bow.name' };
  const keyOf = (m) => m.rawtext.map((r) => r.translate ?? r.text);
  const armed = new Set();
  const p = player(stack(UNDERWATER_BOW.itemId), undefined);

  await t.test('before the bow registers its charge, it draws ready', () => {
    globalThis.__ubNow = 1_000;
    armed.add('p1');
    assert.deepStrictEqual(hudMessage(p), { rawtext: [{ translate: 'andrew.underwater_bow.hud_ready', with: { rawtext: [name] } }] });
  });
  registerArmedState(UNDERWATER_BOW.abilityKey, (who) => armed.has(who.id));
  await t.test('armed: the armed key with the name alone', () => {
    assert.deepStrictEqual(hudMessage(p), { rawtext: [{ translate: 'andrew.underwater_bow.hud_armed', with: { rawtext: [name] } }] });
  });
  await t.test('on cooldown the countdown wins over a charge', () => {
    startCooldown(p, UNDERWATER_BOW.abilityKey);
    globalThis.__ubNow = 1_000 + 2_000;
    assert.deepStrictEqual(hudMessage(p), { rawtext: [{ translate: 'andrew.underwater_bow.hud_cooldown', with: { rawtext: [name, { text: '28' }] } }] });
  });
  await t.test('spent and off cooldown: ready again, nothing re-arms', () => {
    armed.delete('p1');
    clearCooldown(p, UNDERWATER_BOW.abilityKey);
    assert.deepStrictEqual(keyOf(hudMessage(p)), ['andrew.underwater_bow.hud_ready']);
  });
  await t.test('another def is untouched by the bow probe; a throwing probe reads as not armed', () => {
    armed.add('p1');
    const both = player(stack(UNDERWATER_BOW.itemId), stack(STORM_BLADE.itemId));
    assert.deepStrictEqual(keyOf(hudMessage(both)), ['andrew.underwater_bow.hud_armed', '   ', 'andrew.storm_blade.hud_ready']);
    registerArmedState(STORM_BLADE.abilityKey, () => true);
    assert.deepStrictEqual(keyOf(hudMessage(both)), ['andrew.underwater_bow.hud_armed', '   ', 'andrew.storm_blade.hud_ready'], 'a def without hudKeys.armed never draws one');
    registerArmedState(UNDERWATER_BOW.abilityKey, () => {
      throw new Error('boom');
    });
    assert.deepStrictEqual(keyOf(hudMessage(both)), ['andrew.underwater_bow.hud_ready', '   ', 'andrew.storm_blade.hud_ready']);
  });
});

test('static: the HUD states exist in both languages and say three different things', () => {
  const keys = ['andrew.underwater_bow.hud_ready', 'andrew.underwater_bow.hud_armed', 'andrew.underwater_bow.hud_cooldown'];
  const langs = {};
  for (const lang of ['en_US', 'ru_RU']) {
    const map = new Map(
      read('packs', 'resource', 'texts', `${lang}.lang`)
        .split('\n')
        .map((l) => l.replace(/\r$/, ''))
        .filter((l) => l.includes('=') && !l.startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
    );
    const values = keys.map((k) => map.get(k));
    assert.ok(values.every((v) => typeof v === 'string' && v.length > 0), `${lang}: every HUD key has text`);
    assert.strictEqual(new Set(values).size, 3, `${lang}: three different texts`);
    assert.ok(values[0].includes('%s') && values[1].includes('%s') && (values[2].match(/%s/g) ?? []).length === 2, `${lang}: name, and seconds on the cooldown`);
    langs[lang] = values;
  }
  keys.forEach((k, i) => assert.notStrictEqual(langs.en_US[i], langs.ru_RU[i], `${k} is translated`));
});

test('static: ability.ts against its contract', async (t) => {
  const src = read('src', 'ubow', 'ability.ts');
  const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  await t.test('the gesture is read in beforeEvents.itemUse, and on a block in beforeEvents.playerInteractWithBlock', () => {
    assert.match(code, /world\.beforeEvents\.itemUse\.subscribe/);
    assert.match(code, /world\.beforeEvents\.playerInteractWithBlock\.subscribe/);
    assert.match(code, /\.isSneaking/);
    assert.doesNotMatch(code, /afterEvents\.itemUse|resolveActivation/, 'the bow does not claim Use through the framework');
  });
  await t.test('the cooldown starts in one place: the successful hit', () => {
    assert.strictEqual((code.match(/startCooldown\(/g) ?? []).length, 1);
    const spend = code.slice(code.indexOf('function spend('));
    assert.match(spend.slice(0, spend.indexOf('\n}\n')), /startCooldown\(shooter, ABILITY\)/);
  });
  await t.test('exactly 14 through setHit, never an addition, and no real lightning', () => {
    assert.match(code, /setHit\(event, ARMED_DAMAGE, \{ causes: \[EntityDamageCause\.projectile\] \}\)/);
    assert.doesNotMatch(code, /raiseHit|lightning_bolt|spawnEntity|runCommand|applyDamage/);
    assert.match(code, /playStrikes\(rec\.dimension, rec\.foot, rec\.flash, STRIKE_DELAYS\)/);
    assert.match(code, /const STRIKE_DELAYS: readonly number\[\] = \[0\]/);
    assert.match(code, /igniteSuperFire\(rec\.target, SUPER_FIRE_SECONDS\)/);
  });
  await t.test('projectileHitEntity alone never spends: a shield block raises it with no hurt (probe-ubow row 6)', () => {
    const onHit = code.slice(code.indexOf('function onHitEntity('));
    assert.doesNotMatch(onHit.slice(0, onHit.indexOf('\n}\n')), /spend\(/);
  });
  await t.test('the product registers it, before the fires', () => {
    const main = read('src', 'main.ts');
    assert.ok(main.indexOf('registerUbowAbility();') > 0 && main.indexOf('registerUbowAbility();') < main.indexOf('registerUnderwaterBowFire();'));
  });
});

test('static: Projectile Protection counts only for a projectile hit', () => {
  const src = read('src', 'storm', 'damage.ts');
  assert.match(src, /export function defenceOf\(entity: Entity, cause\?: EntityDamageCause\): Defence/);
  assert.match(src, /if \(cause === EntityDamageCause\.projectile\) \{\s*protection \+= PROJECTILE_PROTECTION_EPF \* /);
  assert.match(src, /report\.defence = defenceOf\(target, event\.damageSource\.cause\);/);
  const active = src.slice(src.indexOf('export function stormDamage('));
  assert.match(active.slice(0, active.indexOf('\n}\n')), /const defence = defenceOf\(target\);/, 'the active reads Protection alone');
});

test('static: the README names the gesture, why, and that it holds until xcx33 is answered', () => {
  const readme = read('src', 'ubow', 'README.md');
  assert.match(readme, /xcx33|CX-L0-33/);
  assert.match(readme, /sneak/i);
  assert.match(readme, /isSneaking/);
  assert.match(readme, /Projectile Protection/);
  assert.match(readme, /shield/i);
});
