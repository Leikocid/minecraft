// The Underwater Bow's two fires (spec §1; L0-uwbw-r002, L0-uwbw-esfr, L0-xasm38): src/ubow/fire-rules.ts under node,
// plus the static half of the split between the rules and src/ubow/fire.ts. Any runtime @minecraft import in the
// rules stays external and fails the load below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => readFileSync(join(projectRoot, ...parts), 'utf-8');

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'ubow', 'fire-rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const rules = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  TICKS_PER_SECOND,
  NORMAL_FIRE_SECONDS,
  SUPER_FIRE_SECONDS,
  BURN_INTERVAL_TICKS,
  BURN_DAMAGE,
  ARROW_MEMORY_TICKS,
  LANDING_TICKS,
  ARROW_ID,
  secondsToTicks,
  mergeRemaining,
  normalIgniteTicks,
  isUnderwaterBowArrow,
  normalHitSkip,
  suppressVanillaBurn,
  ArrowBook,
  LandingBook,
  SuperFireBook,
  superVisual,
} = rules;

const SUPER = SUPER_FIRE_SECONDS * TICKS_PER_SECOND;

/**
 * One target's burn, tick by tick, as the two fires' rules decide it: vanilla burning lands every 20 ticks from +1 of
 * its own lighting (probe-ubow row 4) unless suppressVanillaBurn cancels it; Super Fire burns when takeBurn says so.
 * The hurt window is not modelled: it only ever removes hits.
 */
function simulate({ vanillaTicks = 0, superAt = [], until = 300, normalAt = [] } = {}) {
  const book = new SuperFireBook();
  let vanillaLeft = vanillaTicks;
  let vanillaLitAt = vanillaTicks > 0 ? 0 : undefined;
  const landed = [];
  const suppressed = [];
  let lastBurning = -1;
  for (let now = 1; now <= until; now++) {
    for (const s of superAt.filter((s) => s.at === now)) book.ignite('t', now, s.ticks ?? SUPER);
    for (const n of normalAt.filter((n) => n === now)) {
      const set = normalIgniteTicks(vanillaLeft, book.ticksLeft('t', now));
      if (set !== undefined) {
        vanillaLeft = set;
        vanillaLitAt = now;
      }
    }
    if (vanillaLeft > 0 && vanillaLitAt !== undefined && (now - vanillaLitAt - 1) % BURN_INTERVAL_TICKS === 0) {
      if (suppressVanillaBurn('fireTick', false, book.isBurning('t', now))) suppressed.push(now);
      else landed.push({ now, by: 'vanilla' });
    }
    if (book.takeBurn('t', now)) landed.push({ now, by: 'super' });
    if (vanillaLeft > 0 || book.isBurning('t', now)) lastBurning = now;
    if (book.get('t') !== undefined && book.isSpent('t')) book.drop('t');
    if (vanillaLeft > 0) vanillaLeft--;
  }
  return { landed, suppressed, lastBurning, damage: landed.length * BURN_DAMAGE };
}

test('spec §1 numbers: ordinary fire 2 s, Super Fire 5 s, vanilla burn rate 1 HP per 20 ticks', () => {
  assert.equal(NORMAL_FIRE_SECONDS, 2);
  assert.equal(SUPER_FIRE_SECONDS, 5);
  assert.equal(BURN_INTERVAL_TICKS, 20);
  assert.equal(BURN_DAMAGE, 1);
  assert.equal(secondsToTicks(2), 40);
  assert.equal(secondsToTicks(5), 100);
  assert.equal(secondsToTicks(-1), 0);
});

test('two fires never add: the one with more time left burns on (xasm38)', () => {
  assert.equal(mergeRemaining(40, 100), 100);
  assert.equal(mergeRemaining(160, 100), 160);
  assert.equal(mergeRemaining(0, 40), 40);
  assert.equal(mergeRemaining(-3, 0), 0);
  assert.notEqual(mergeRemaining(40, 100), 140, 'the times are not summed');
});

test('a normal hit sets 2 s only when the target burns for less than that', () => {
  assert.equal(normalIgniteTicks(0, 0), 40, 'a cold target gets the 2 s fire');
  assert.equal(normalIgniteTicks(12, 0), 40, 'a shorter vanilla fire is raised to 2 s, not added to');
  assert.equal(normalIgniteTicks(99, 0), undefined, "Flame's 5 s is kept, never cut down to 2 s");
  assert.equal(normalIgniteTicks(40, 0), undefined, 'an equal fire is left alone');
  assert.equal(normalIgniteTicks(0, 100), undefined, 'a Super Fire window covers the 2 s');
  assert.equal(normalIgniteTicks(0, 30), 40, 'Super Fire with less than 2 s left: the 2 s fire outlasts it');
});

test('Super Fire: a 5 s window burns exactly 5 times at +20 … +100 and then ends', () => {
  const book = new SuperFireBook();
  const start = 1000;
  const lit = book.ignite('t', start, SUPER);
  assert.equal(lit.refreshed, false);
  assert.equal(lit.fire.untilTick, start + SUPER);
  const burns = [];
  let spentAt;
  for (let now = start; now <= start + 200; now++) {
    if (book.takeBurn('t', now)) burns.push(now - start);
    if (spentAt === undefined && book.isSpent('t')) spentAt = now - start;
  }
  assert.deepEqual(burns, [20, 40, 60, 80, 100]);
  assert.equal(spentAt, 100, 'the record is spent on its last burn tick');
  assert.equal(book.get('t').burns, 5);
  assert.equal(book.isBurning('t', start + 100), true, 'the last burn tick is inside the window');
  assert.equal(book.isBurning('t', start + 101), false);
  assert.equal(book.ticksLeft('t', start + 40), 60);
});

test('Super Fire: the first burn is past the 10-tick hurt window the lighting hit opens', () => {
  const book = new SuperFireBook();
  book.ignite('t', 0, SUPER);
  for (let now = 0; now <= 10; now++) assert.equal(book.takeBurn('t', now), false, `no burn at +${now}`);
});

test('Super Fire: a second ignite refreshes one record and never stacks a second burn', () => {
  const book = new SuperFireBook();
  book.ignite('t', 0, SUPER);
  const again = book.ignite('t', 50, SUPER);
  assert.equal(again.refreshed, true);
  assert.equal(book.size, 1);
  assert.equal(again.fire.untilTick, 150, 'the later end wins');
  assert.equal(again.fire.nextBurnTick, 20, 'the burn cadence is kept, not restarted at +70');
  const shorter = book.ignite('t', 60, 1);
  assert.equal(shorter.fire.untilTick, 150, 'a shorter ignite does not cut the window');

  const { landed } = simulate({ superAt: [{ at: 1 }, { at: 51 }] });
  const ticks = landed.map((l) => l.now);
  assert.deepEqual(ticks, [21, 41, 61, 81, 101, 121, 141]);
  for (let i = 1; i < ticks.length; i++) assert.ok(ticks[i] - ticks[i - 1] >= BURN_INTERVAL_TICKS, '1 HP a second at most');
});

test('Super Fire after a spent record starts a fresh window', () => {
  const book = new SuperFireBook();
  book.ignite('t', 0, SUPER);
  for (let now = 0; now <= 100; now++) book.takeBurn('t', now);
  assert.equal(book.isSpent('t'), true);
  const fresh = book.ignite('t', 100, SUPER);
  assert.equal(fresh.refreshed, false);
  assert.equal(fresh.fire.nextBurnTick, 120);
  assert.equal(fresh.fire.burns, 0);
});

test('vanilla fire 8 s, then Super Fire 5 s: 1 HP a second throughout and the burn lasts the longer 8 s', () => {
  const both = simulate({ vanillaTicks: 160, superAt: [{ at: 5 }] });
  assert.deepEqual(both.suppressed, [21, 41, 61, 81, 101], 'vanilla burns inside the Super Fire window are cancelled');
  assert.deepEqual(
    both.landed.map((l) => `${l.by}@${l.now}`),
    ['vanilla@1', 'super@25', 'super@45', 'super@65', 'super@85', 'super@105', 'vanilla@121', 'vanilla@141'],
  );
  assert.equal(both.damage, 8, 'eight seconds of burning, eight HP');
  assert.equal(both.lastBurning, 160, 'the vanilla fire with more time left burns on after the window');

  const vanillaAlone = simulate({ vanillaTicks: 160 });
  const superAlone = simulate({ superAt: [{ at: 5 }] });
  assert.equal(vanillaAlone.damage + superAlone.damage, 13, 'what adding the two fires would have dealt');
  assert.ok(both.damage < vanillaAlone.damage + superAlone.damage);
});

test('Super Fire, then a normal hit: nothing is added while the window covers 2 s', () => {
  const sim = simulate({ superAt: [{ at: 1 }], normalAt: [30] });
  assert.equal(sim.damage, 5, 'still five burns');
  assert.equal(sim.landed.every((l) => l.by === 'super'), true);
  assert.equal(sim.lastBurning, 101);

  const late = simulate({ superAt: [{ at: 1 }], normalAt: [90] });
  assert.equal(late.lastBurning, 129, 'the 2 s fire lit with 11 ticks of Super Fire left burns on to its own end');
  assert.deepEqual(late.suppressed, [91], "the 2 s fire's first burn falls inside the window and is cancelled");
  assert.deepEqual(late.landed.map((l) => `${l.by}@${l.now}`), ['super@21', 'super@41', 'super@61', 'super@81', 'super@101', 'vanilla@111']);
});

test('only vanilla burning on a Super Fire target is cancelled', () => {
  assert.equal(suppressVanillaBurn('fireTick', false, true), true);
  assert.equal(suppressVanillaBurn('fireTick', true, true), false, "the module's own scripted burn passes");
  assert.equal(suppressVanillaBurn('fireTick', false, false), false, 'no Super Fire: vanilla burning is untouched');
  assert.equal(suppressVanillaBurn('fire', false, true), false, 'standing in a fire block still hurts');
  assert.equal(suppressVanillaBurn('lava', false, true), false);
});

test("an arrow is this bow's only from a player holding a live Underwater Bow in the main hand", () => {
  const shot = { typeId: ARROW_ID, ownerIsPlayer: true, mainHand: 'andrew:underwater_bow', stale: false };
  assert.equal(isUnderwaterBowArrow(shot), true);
  assert.equal(isUnderwaterBowArrow({ ...shot, mainHand: 'minecraft:bow' }), false, 'a vanilla bow');
  assert.equal(isUnderwaterBowArrow({ ...shot, mainHand: undefined }), false);
  assert.equal(isUnderwaterBowArrow({ ...shot, ownerIsPlayer: false }), false, "a skeleton's or dispenser's arrow");
  assert.equal(isUnderwaterBowArrow({ ...shot, stale: true }), false, 'a superseded copy (R-lgnd-005)');
  assert.equal(isUnderwaterBowArrow({ ...shot, typeId: 'minecraft:snowball' }), false);
});

test('an ordinary hit is a landed projectile hurt of a known arrow', () => {
  assert.equal(normalHitSkip('projectile', 6, true), undefined);
  assert.equal(normalHitSkip('entityAttack', 6, true), 'cause');
  assert.equal(normalHitSkip('projectile', 0, true), 'no-damage');
  assert.equal(normalHitSkip('projectile', 6, false), 'not-ours');
});

test('ArrowBook: an arrow is claimed once and forgotten after its memory runs out', () => {
  const book = new ArrowBook();
  book.remember('a1', 'p1', 0);
  assert.equal(book.has('a1'), true);
  assert.equal(book.claim('a1'), 'p1');
  assert.equal(book.claim('a1'), undefined, 'claimed once');
  assert.equal(book.claim(undefined), undefined);
  book.remember('a2', 'p1', 0);
  book.remember('a3', 'p1', ARROW_MEMORY_TICKS + 1);
  assert.equal(book.has('a2'), false, 'swept on the next remember');
  assert.equal(book.has('a3'), true);
  book.forget('a3');
  assert.equal(book.size, 0);
});

test('LandingBook: the before-event pairing is taken once, within the landing ticks', () => {
  const book = new LandingBook();
  book.expect('t', 'a1', 10);
  assert.equal(book.take('t', 10 + LANDING_TICKS), 'a1');
  assert.equal(book.take('t', 10), undefined, 'taken once');
  book.expect('t', 'a2', 10);
  assert.equal(book.take('t', 11 + LANDING_TICKS), undefined, 'a hit with no after-event did not land');
  assert.equal(book.size, 0);
});

test("Super Fire's look: engine flames out of water, particles where the engine shows none", () => {
  assert.deepEqual(superVisual(false, 0, 100, 0), { kind: 'flames', seconds: 5 });
  assert.deepEqual(superVisual(false, 0, 59, 10), { kind: 'flames', seconds: 2 }, 'whole seconds only: never past the window');
  assert.deepEqual(superVisual(false, 80, 80, 20), { kind: 'none' }, 'flames already on');
  assert.deepEqual(superVisual(true, 0, 80, 20), { kind: 'particles' });
  assert.deepEqual(superVisual(true, 0, 80, 21), { kind: 'none' });
  assert.deepEqual(superVisual(false, 0, 15, 20), { kind: 'particles' }, 'under a second left: no flames to put on');
  assert.deepEqual(superVisual(false, 0, 0, 20), { kind: 'none' });
});

test('the rules are a module of their own: no engine import, and the engine side uses them', () => {
  const rulesSrc = read('src', 'ubow', 'fire-rules.ts');
  assert.doesNotMatch(rulesSrc, /from\s+["']@minecraft\//, 'fire-rules.ts imports no @minecraft module');
  const fireSrc = read('src', 'ubow', 'fire.ts');
  assert.match(fireSrc, /from\s+"\.\/fire-rules"/);
  for (const name of ['normalIgniteTicks', 'suppressVanillaBurn', 'SuperFireBook', 'isUnderwaterBowArrow', 'superVisual']) {
    assert.match(fireSrc, new RegExp(`\\b${name}\\b`), `fire.ts uses ${name}`);
  }
  assert.match(fireSrc, /applyScriptedDamage\(target, BURN_DAMAGE, \{ cause: EntityDamageCause\.fireTick \}\)/, 'the burn is scripted fireTick, marked through scripted-damage.ts');
  assert.match(fireSrc, /export function igniteSuperFire\(target: Entity, seconds = SUPER_FIRE_SECONDS\)/, 'the call the armed hit makes');
  assert.match(read('src', 'main.ts'), /registerUnderwaterBowFire\(\);/, 'the release pack registers the fires');
});
