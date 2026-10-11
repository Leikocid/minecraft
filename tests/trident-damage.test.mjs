// The Above-Water Trident's hit decisions and bookkeeping (spec §02 item 1; L0-trdt-r002, L0-adr-twlt, L0-trdt-addm):
// src/trident/damage-rules.ts under node, plus the static half of the task's criteria on src/trident/damage.ts and its
// README. Any runtime @minecraft import stays external and fails the load below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRIDENT_DIR = join(projectRoot, 'src', 'trident');
const read = (...parts) => readFileSync(join(projectRoot, ...parts), 'utf-8');

const bundle = await build({
  entryPoints: [join(TRIDENT_DIR, 'damage-rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const rules = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  TRIDENT_BONUS,
  THROWN_BASE,
  THROW_ID_PROPERTY,
  THROWN_KEY_TICKS,
  MELEE_KEY_TICKS,
  LANDING_TICKS,
  NO_ATTACKER,
  HitLedger,
  LandingBook,
  meleeKey,
  thrownKey,
  meleeSkip,
  thrownSkip,
} = rules;

/** What damage.ts does with one projectileHitEntity: skip, then claim the throw's key; true = one bonus applied. */
function thrownEvent(ledger, { throwId, targetId, throwerId = 'thrower', living = true }, now) {
  if (thrownSkip({ throwId, self: throwerId === targetId, living: () => living }) !== undefined) return false;
  return ledger.claim(thrownKey(throwId, targetId), now, THROWN_KEY_TICKS);
}

const meleeHit = (over = {}) => ({
  cause: 'entityAttack',
  byPlayer: true,
  cancelled: false,
  scripted: false,
  mainHand: 'andrew:above_water_trident',
  living: () => true,
  stale: () => false,
  ...over,
});

test('the numbers the module stands on', () => {
  assert.equal(TRIDENT_BONUS, 2, 'spec §02: +2 HP');
  assert.equal(THROWN_BASE, 8, 'probe-trident P2: a vanilla thrown trident hits for 8.00 bare');
  assert.equal(MELEE_KEY_TICKS, 10, 'a melee key lives one hurt window');
  assert.ok(THROWN_KEY_TICKS >= 600, 'a throw key outlives the 30 s return ceiling');
  assert.ok(LANDING_TICKS >= 1);
  const probe = read('src', 'gametest', 'trident-probe.ts');
  assert.match(probe, new RegExp(`THROW_PROP = "${THROW_ID_PROPERTY.replace('.', '\\.')}"`), 'the custody key is the one probe-trident P9 measured');
});

test('AC5: two events for one throw hitting one target give one bonus', () => {
  const ledger = new HitLedger();
  const hit = { throwId: 'throw-1', targetId: 'zombie' };
  const bonuses = [thrownEvent(ledger, hit, 100), thrownEvent(ledger, hit, 100)].filter(Boolean).length;
  assert.equal(bonuses, 1, 'same tick: the second event is a duplicate');
  assert.equal(thrownEvent(ledger, hit, 101), false, 'the next tick: still the same hit');
  assert.equal(thrownEvent(ledger, hit, 100 + THROWN_KEY_TICKS - 1), false, 'held for the whole throw');
});

test('AC5: a different target or a different throw is a different hit', () => {
  const ledger = new HitLedger();
  assert.equal(thrownEvent(ledger, { throwId: 'throw-1', targetId: 'zombie' }, 5), true);
  assert.equal(thrownEvent(ledger, { throwId: 'throw-1', targetId: 'pig' }, 5), true, 'one throw, a second target');
  assert.equal(thrownEvent(ledger, { throwId: 'throw-2', targetId: 'zombie' }, 6), true, 'the next throw at the same target');
  assert.equal(thrownEvent(ledger, { throwId: 'throw-2', targetId: 'zombie' }, 6), false);
});

test('AC5: a melee hit is keyed by attacker, tick and target', () => {
  const ledger = new HitLedger();
  const claim = (a, t, z) => ledger.claim(meleeKey(a, t, z), t, MELEE_KEY_TICKS);
  assert.equal(claim('p1', 40, 'z'), true);
  assert.equal(claim('p1', 40, 'z'), false, 'a second event for the same swing');
  assert.equal(claim('p2', 40, 'z'), true, 'another attacker in the same tick');
  assert.equal(claim('p1', 50, 'z'), true, 'the same attacker ten ticks later swings again');
  assert.notEqual(meleeKey('a', 1, 'b'), thrownKey('a', 'b'), 'melee and thrown keys never collide');
});

test('the ledger sweeps keys whose ticks are over, and only those', () => {
  const ledger = new HitLedger(4);
  for (let i = 0; i < 4; i++) ledger.claim(`k${i}`, 0, 10);
  ledger.claim('late', 9, 100);
  assert.equal(ledger.size, 5, 'nothing expired yet at tick 9');
  ledger.claim('later', 20, 100);
  assert.equal(ledger.size, 2, 'the four tick-0 keys expired at 10 and went with the next sweep');
  assert.equal(ledger.claim('late', 20, 100), false, 'a live key survives the sweep');
  assert.equal(ledger.claim('k0', 20, 10), true, 'an expired key can be claimed again');
});

test('a hit lands only through its own after-event, within the landing ticks', () => {
  const book = new LandingBook();
  book.expect('zombie', 'p1', 100, 'strike-1');
  assert.equal(book.land('zombie', 'p2', 100), undefined, 'another attacker is not this hit');
  assert.equal(book.land('pig', 'p1', 100), undefined, 'another target is not this hit');
  assert.equal(book.land('zombie', 'p1', 100), 'strike-1');
  assert.equal(book.land('zombie', 'p1', 100), undefined, 'one strike per accepted hit, however many after-events');

  book.expect('zombie', 'p1', 200, 'swallowed');
  assert.equal(book.land('zombie', 'p1', 200 + LANDING_TICKS + 1), undefined, 'a hit the window swallowed never lands');
  assert.equal(book.size, 0);

  book.expect('zombie', NO_ATTACKER, 300, 'sourceless');
  assert.equal(book.land('zombie', NO_ATTACKER, 300 + LANDING_TICKS), 'sourceless', 'a throw whose thrower left still lands');
});

test('melee: only a player\'s trident swing on a living target is raised, and cheap checks come first', () => {
  assert.equal(meleeSkip(meleeHit()), undefined);
  const living = () => assert.fail('living() read before a cheaper skip');
  assert.equal(meleeSkip(meleeHit({ cause: 'projectile', living })), 'cause');
  assert.equal(meleeSkip(meleeHit({ byPlayer: false, living })), 'not-player');
  assert.equal(meleeSkip(meleeHit({ cancelled: true, living })), 'cancelled');
  assert.equal(meleeSkip(meleeHit({ scripted: true, living })), 'scripted', 'the overkill follow-through is not a swing');
  assert.equal(meleeSkip(meleeHit({ mainHand: 'minecraft:trident', living })), 'not-trident');
  assert.equal(meleeSkip(meleeHit({ mainHand: undefined, living })), 'not-trident');
  assert.equal(meleeSkip(meleeHit({ living: () => false })), 'not-living');
  assert.equal(meleeSkip(meleeHit({ stale: () => true })), 'stale');
});

test('thrown: only a projectile carrying a throw id, on a living target other than the thrower', () => {
  assert.equal(thrownSkip({ throwId: 'throw-1', self: false, living: () => true }), undefined);
  for (const throwId of [undefined, '', 7, true]) assert.equal(thrownSkip({ throwId, self: false, living: () => true }), 'no-throw', String(throwId));
  assert.equal(thrownSkip({ throwId: 'throw-1', self: true, living: () => true }), 'self');
  assert.equal(thrownSkip({ throwId: 'throw-1', self: false, living: () => false }), 'not-living');
});

/** The text of `export function <name>` up to its closing brace at column 0. */
function functionText(code, name) {
  const start = code.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  return code.slice(start, code.indexOf('\n}\n', start) + 2);
}

/** The /** … *\/ block right above `export function <name>`. */
function docAbove(code, name) {
  const start = code.indexOf(`export function ${name}(`);
  const open = code.lastIndexOf('/**', start);
  return code.slice(open, start);
}

test('AC6: the thrown path is its own and says why it is not raiseHit', () => {
  const code = read('src', 'trident', 'damage.ts');
  const thrown = functionText(code, 'thrownHit');
  assert.doesNotMatch(thrown, /raiseHit\(/, 'thrownHit must not call raiseHit');
  const body = (name) => code.slice(code.indexOf(`function ${name}(`), code.indexOf('\n}\n', code.indexOf(`function ${name}(`)));
  for (const name of ['raiseThrown', 'onThrownNative']) assert.doesNotMatch(body(name), /raiseHit\(/, `${name} must not call raiseHit`);
  assert.match(body('raiseThrown'), /planRaise\(/, 'the thrown raise uses the shared arithmetic');
  assert.match(body('onThrownNative'), /raiseThrown\(event, thrower, report\)/, 'a body with impact damage is raised by the same thrown raise');
  const why = docAbove(code, 'thrownHit');
  assert.match(why, /not storm\/damage\.ts's raiseHit/);
  assert.match(why, /P10/, 'the reason cites the measurement that the body deals no damage');
  assert.match(why, /projectile/, 'and the cause raiseHit refuses');
  const melee = code.slice(code.indexOf('function onMelee('), code.indexOf('\n}\n', code.indexOf('function onMelee(')));
  assert.match(melee, /raiseHit\(event, TRIDENT_BONUS\)/, 'the melee goes through the Storm Blade helper (L0-trdt-addm §2)');
});

test('no real lightning: nothing in src/trident spawns an entity or names the bolt', () => {
  for (const name of readdirSync(TRIDENT_DIR).filter((f) => f.endsWith('.ts'))) {
    const code = read('src', 'trident', name);
    assert.doesNotMatch(code, /lightning_bolt/, name);
    // The guarantee is about lightning, not about entities: throw.ts spawns the
    // in-flight trident, which the spec asks for. A blanket spawnEntity ban
    // forbids that too, and went red the moment the throw landed.
    assert.doesNotMatch(code, /spawnEntity\(\s*["'`][^"'`]*lightning/i, name);
    assert.doesNotMatch(code, /summon\s+[^\n]*lightning/i, name);
  }
  const code = read('src', 'trident', 'damage.ts');
  assert.match(code, /import \{ playStrikes \} from "\.\.\/storm\/visuals"/, 'the strike is the Storm Blade visual, imported, not copied');
  assert.match(code, /applyScriptedDamage\(target, THROWN_BASE,/, 'the thrown base is marked as the pack\'s own damage');
});

test('AC7: the module README names the missing lightning entity as a limitation, with the measurement', () => {
  const readme = read('src', 'trident', 'README.md');
  const limits = readme.slice(readme.indexOf('### Limitations'));
  assert.ok(limits.length > 20, 'a Limitations section');
  assert.match(limits, /No lightning entity is spawned/);
  assert.match(limits, /minecraft:lightning_bolt/);
  assert.match(limits, /storm_active_harmless/, 'the scenario that measured it');
  assert.match(limits, /src\/storm\/README\.md/, 'where the measurement is written up');
  assert.match(limits, /CX-L0-29/, 'the decision it rests on');
  const storm = read('src', 'storm', 'README.md');
  assert.match(storm, /storm_active_harmless/, 'the cited measurement exists');
});

test('the release entry and the GameTest pack arm the module', () => {
  assert.match(read('src', 'main.ts'), /^registerTridentDamage\(\);$/m);
  assert.match(read('src', 'gametest', 'trident-damage.ts'), /^registerTridentDamage\(\);$/m);
  assert.match(read('src', 'gametest', 'main.ts'), /^import "\.\/trident-damage";$/m);
  const runner = read('scripts', 'bds-gametest.mjs');
  for (const name of ['trident_damage_melee', 'trident_damage_thrown', 'trident_damage_lethal']) assert.match(runner, new RegExp(`'andrew:${name}'`));
});
