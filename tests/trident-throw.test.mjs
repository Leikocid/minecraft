// The Above-Water Trident's throw and return, pure rules (src/trident/throw-rules.ts; L0-adr-twth §2,
// L0-trdt-pthr, L0-trdt-pfbk, L0-trdt-ecus): the throw order record → clear → launch and every failure
// in between, the release decision, the 10 b/s return step, the per-tick custody decision and the ledger.
// The module runs with no engine: any runtime @minecraft import stays external and fails the load below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES_TS = join(root, 'src', 'trident', 'throw-rules.ts');
const THROW_TS = join(root, 'src', 'trident', 'throw.ts');

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
  ARRIVE_DISTANCE,
  FLIGHT_CAP_TICKS,
  LAUNCH_SPEED,
  MIN_CHARGE_TICKS,
  RETURN_CAP_TICKS,
  RETURN_STEP,
  STALL_TICKS,
  STILL_TICKS,
  USE_DURATION_TICKS,
  chargeOf,
  custodyAction,
  parseLedger,
  releaseDecision,
  returnStep,
  runThrow,
  serializeLedger,
} = rules;

/**
 * A world of one copy and the throw's effects on it. `copies()` is where the copy is right now; the
 * port records every call so the order is the assertion, and `failAt` makes one step throw.
 */
function world(failAt, { restoreFails = false } = {}) {
  const w = { hand: true, record: false, entity: false, bound: false, calls: [], minCopies: Infinity, emptyMoments: [] };
  const step = (name, fn) => {
    w.calls.push(name);
    if (failAt === name) throw new Error(`${name} refused`);
    fn();
    const n = Number(w.hand) + Number(w.record);
    w.minCopies = Math.min(w.minCopies, n);
    if (n === 0) w.emptyMoments.push(name);
  };
  w.port = {
    writeRecord: () => step('record', () => (w.record = true)),
    clearHand: () => step('clear', () => (w.hand = false)),
    launch: () => {
      step('launch', () => (w.entity = true));
      return 'entity-1';
    },
    bindEntity: (id) => step('bind', () => (w.bound = id === 'entity-1')),
    restoreHand: () => {
      w.calls.push('restore');
      if (restoreFails) throw new Error('hand refused');
      w.hand = true;
    },
    deleteRecord: () => {
      w.calls.push('delete');
      w.record = false;
    },
  };
  return w;
}

test('the throw writes the record, then clears the hand, then launches, then binds (L0-adr-twth §2)', () => {
  const w = world();
  const out = runThrow(w.port);
  assert.deepEqual(w.calls, ['record', 'clear', 'launch', 'bind']);
  assert.deepEqual(out, { thrown: true, entityId: 'entity-1' });
  assert.equal(w.hand, false);
  assert.equal(w.record && w.entity && w.bound, true);
  assert.equal(w.minCopies, 1, 'at no step is the copy nowhere');
  assert.deepEqual(w.emptyMoments, []);
});

test('a refused record write touches nothing: the copy stays in the hand', () => {
  const w = world('record');
  const out = runThrow(w.port);
  assert.deepEqual(w.calls, ['record']);
  assert.equal(out.thrown, false);
  assert.equal(out.failedAt, 'record');
  assert.equal(w.hand, true);
  assert.equal(w.record, false);
});

test('a refused hand clear drops the record: one copy, in the hand', () => {
  const w = world('clear');
  const out = runThrow(w.port);
  assert.deepEqual(w.calls, ['record', 'clear', 'delete']);
  assert.equal(out.failedAt, 'clear');
  assert.equal(Number(w.hand) + Number(w.record), 1);
  assert.equal(w.hand, true);
});

test('a refused launch puts the clone back before the record goes', () => {
  const w = world('launch');
  const out = runThrow(w.port);
  assert.deepEqual(w.calls, ['record', 'clear', 'launch', 'restore', 'delete']);
  assert.deepEqual([out.failedAt, out.restored], ['launch', true]);
  assert.equal(w.hand, true);
  assert.equal(w.record, false);
  assert.equal(w.minCopies, 1);
});

test('a launch AND a refused hand leave the record for the fallback, never nothing', () => {
  const w = world('launch', { restoreFails: true });
  const out = runThrow(w.port);
  assert.deepEqual(w.calls, ['record', 'clear', 'launch', 'restore']);
  assert.deepEqual([out.failedAt, out.restored], ['launch', false]);
  assert.equal(w.hand, false);
  assert.equal(w.record, true, 'the record is the one place the copy is; custodyAction delivers it next tick');
});

test('a refused bind leaves the record without an entity, which the next custody tick delivers', () => {
  const w = world('bind');
  const out = runThrow(w.port);
  assert.deepEqual(w.calls, ['record', 'clear', 'launch', 'bind']);
  assert.deepEqual([out.failedAt, out.restored], ['bind', false]);
  assert.equal(w.record, true);
  const next = custodyAction({ ...VIEW, entityValid: false });
  assert.deepEqual(next, { kind: 'deliver', how: 'custody entity unloaded' });
});

test('negative control: the hand-first order has a moment with no copy anywhere', () => {
  // The order runThrow refuses, run against the same model: a failure of the record write after the hand
  // was cleared loses the copy. This is why the record goes first.
  const w = world('record');
  try {
    w.port.clearHand();
    w.port.writeRecord();
  } catch {
    // The record write refused.
  }
  assert.equal(Number(w.hand) + Number(w.record), 0);
  assert.deepEqual(w.emptyMoments, ['clear']);
});

test('the production throw goes through runThrow, with the port steps in that order', () => {
  const src = readFileSync(THROW_TS, 'utf-8');
  const call = src.slice(src.indexOf('runThrow({'));
  assert.ok(call.length > 0 && src.includes('runThrow({'), 'throw.ts does not call runThrow');
  const at = (key) => call.indexOf(`${key}:`);
  assert.ok(at('writeRecord') >= 0 && at('writeRecord') < at('clearHand') && at('clearHand') < at('launch') && at('launch') < at('bindEntity'));
  assert.match(call.slice(at('writeRecord'), at('clearHand')), /put\(record, clone\)/);
  const before = src.slice(0, src.indexOf('runThrow({'));
  assert.doesNotMatch(before.slice(before.indexOf('function throwFrom')), /setItem|setOffhand|spawnEntity/, 'nothing touches the hand or the world before the record');
});

test('release: charge = 72000 − useDuration; under 10 ticks nothing, sneaking dashes, standing throws', () => {
  assert.equal(USE_DURATION_TICKS, 72000);
  assert.equal(chargeOf(71980), 20);
  assert.equal(MIN_CHARGE_TICKS, 10);
  assert.equal(releaseDecision(chargeOf(71995), false), 'too-short');
  assert.equal(releaseDecision(9, false), 'too-short');
  assert.equal(releaseDecision(10, false), 'throw');
  assert.equal(releaseDecision(20, true), 'dash');
  assert.equal(releaseDecision(5, true), 'too-short');
  assert.equal(releaseDecision(Number.NaN, false), 'too-short');
});

test('launch speed is inside the vanilla range measured by probe P7 (3.88–4.00 b/t)', () => {
  assert.ok(LAUNCH_SPEED >= 3.88 && LAUNCH_SPEED <= 4.0);
});

test('the return moves 0.5 b/t = 10 b/s straight at the chest, and 20 blocks take 40 ticks', () => {
  assert.equal(RETURN_STEP * 20, 10);
  const to = { x: 0, y: 1.2, z: 0 };
  let at = { x: 22.5, y: 3, z: 0.5 };
  let path = 0;
  let ticks = 0;
  let t20;
  for (;;) {
    const s = returnStep(at, to);
    if (s.arrived) break;
    path += Math.hypot(s.next.x - at.x, s.next.y - at.y, s.next.z - at.z);
    at = s.next;
    ticks++;
    if (t20 === undefined && path >= 20 - 1e-9) t20 = ticks;
    assert.ok(ticks < 1000);
  }
  assert.equal(t20, 40);
  assert.ok(Math.hypot(at.x - to.x, at.y - to.y, at.z - to.z) <= ARRIVE_DISTANCE);
  const near = returnStep({ x: 1, y: 1.2, z: 0 }, to);
  assert.deepEqual([near.arrived, near.next], [true, { x: 1, y: 1.2, z: 0 }]);
  const last = returnStep({ x: 1.8, y: 1.2, z: 0 }, to);
  assert.equal(last.arrived, false);
  assert.ok(Math.abs(last.next.x - 1.3) < 1e-9, 'one step, never past the target');
});

const VIEW = {
  state: 'returning',
  now: 1000,
  since: 900,
  returnSince: 950,
  live: true,
  hasClone: true,
  owner: 'online',
  sameDimension: true,
  entityValid: true,
  aheadLoaded: true,
  stillTicks: 0,
  stallTicks: 0,
};

test('custody: each fallback of L0-trdt-pfbk delivers, and the order of the checks holds', () => {
  assert.deepEqual(custodyAction(VIEW), { kind: 'go' });
  assert.deepEqual(custodyAction({ ...VIEW, live: false, owner: 'offline' }), { kind: 'discard' }, 'a stale mark is never delivered');
  assert.deepEqual(custodyAction({ ...VIEW, hasClone: false, owner: 'online' }), { kind: 'deliver', how: 'restart' });
  assert.deepEqual(custodyAction({ ...VIEW, owner: 'offline' }), { kind: 'deliver', how: 'thrower offline' });
  assert.deepEqual(custodyAction({ ...VIEW, owner: 'dead' }), { kind: 'deliver', how: 'thrower died' });
  assert.deepEqual(custodyAction({ ...VIEW, sameDimension: false }), { kind: 'deliver', how: 'thrower changed dimension' });
  assert.deepEqual(custodyAction({ ...VIEW, entityValid: false }), { kind: 'deliver', how: 'custody entity unloaded' });
  assert.deepEqual(custodyAction({ ...VIEW, aheadLoaded: false }), { kind: 'deliver', how: 'custody entity unloaded' });
  assert.deepEqual(custodyAction({ ...VIEW, stallTicks: STALL_TICKS }), { kind: 'deliver', how: 'custody entity not ticking' });
  assert.deepEqual(custodyAction({ ...VIEW, live: undefined }), { kind: 'go' }, 'an unmarked copy is never stale');
});

test('custody: the 30 s return cap fires after 600 ticks of return, not of flight', () => {
  assert.equal(RETURN_CAP_TICKS, 600);
  assert.deepEqual(custodyAction({ ...VIEW, now: 950 + 600 }), { kind: 'go' });
  assert.deepEqual(custodyAction({ ...VIEW, now: 950 + 601 }), { kind: 'deliver', how: 'return cap' });
  assert.deepEqual(custodyAction({ ...VIEW, since: 0, now: 950 + 100 }), { kind: 'go' });
});

test('custody: a flight turns back on its cap, at the edge of the loaded world, or stuck; it is never steered', () => {
  const flying = { ...VIEW, state: 'flying', returnSince: undefined, since: 1000 };
  assert.deepEqual(custodyAction(flying), { kind: 'go' });
  assert.equal(FLIGHT_CAP_TICKS, 200);
  assert.deepEqual(custodyAction({ ...flying, now: 1000 + 201 }), { kind: 'turn', how: 'flight cap' });
  assert.deepEqual(custodyAction({ ...flying, aheadLoaded: false }), { kind: 'turn', how: 'edge of the loaded world' });
  assert.deepEqual(custodyAction({ ...flying, stillTicks: STILL_TICKS }), { kind: 'turn', how: 'stuck' });
  assert.deepEqual(custodyAction({ ...flying, owner: 'dead' }), { kind: 'deliver', how: 'thrower died' });
});

test('ledger: records round-trip; a malformed one is dropped, never the ledger', () => {
  const mark = { origin: 'admin', owner: 'P1', id: 'i1', gen: 2, holder: 'P1', look: { enchantments: [['minecraft:unbreaking', 3]] } };
  const a = { throwId: 'main-1-a', owner: 'P1', ownerName: 'alice', hand: 'off', slot: 3, mark, state: 'returning', entityId: '-42', dimension: 'minecraft:overworld', last: { x: 1, y: 2, z: 3 }, since: 10, returnSince: 15 };
  const b = { throwId: 'main-2-b', owner: 'P2', ownerName: 'bob', hand: 'main', slot: 0, state: 'flying', dimension: 'minecraft:nether', last: { x: 0, y: 0, z: 0 }, since: 20 };
  const raw = serializeLedger([a, b]);
  const back = parseLedger(raw);
  assert.deepEqual(back.get('main-1-a'), a);
  assert.deepEqual(back.get('main-2-b'), b);
  assert.equal(serializeLedger([]), undefined, 'an empty ledger deletes the property');
  const broken = JSON.parse(raw);
  broken.push({ throwId: 'x', owner: 'P3' }, { ...b, throwId: 'main-3-c', mark: { origin: 'nope' } }, 7);
  const kept = parseLedger(JSON.stringify(broken));
  assert.deepEqual([...kept.keys()], ['main-1-a', 'main-2-b']);
  assert.equal(parseLedger('not json').size, 0);
  assert.equal(parseLedger(undefined).size, 0);
});

const readJson = (...parts) => JSON.parse(readFileSync(join(root, ...parts), 'utf-8'));

test('entities: the flight is the measured vanilla trajectory; the return body has no physics', () => {
  const flying = readJson('packs', 'behavior', 'entities', 'trident_in_flight.json')['minecraft:entity'];
  const p = flying.components['minecraft:projectile'];
  assert.equal(flying.description.runtime_identifier, 'minecraft:snowball');
  assert.deepEqual([p.gravity, p.inertia, p.liquid_inertia, p.uncertainty_base], [0.1, 0.99, 0.99, 0], 'probe P7');
  assert.equal(p.on_hit.remove_on_hit, undefined, 'L0-adr-twth §2: no remove_on_hit');
  assert.ok(p.on_hit.stick_in_ground, 'a hit must stop it, or it passes through blocks');
  const returning = readJson('packs', 'behavior', 'entities', 'trident_returning.json')['minecraft:entity'];
  assert.equal(returning.description.identifier, 'andrew:trident_returning');
  assert.equal(returning.components['minecraft:projectile'], undefined, 'a return body never raises projectile hits');
  assert.deepEqual(returning.components['minecraft:physics'], { has_gravity: false, has_collision: false }, 'probe P8: steered by teleport only');
  for (const e of [flying, returning]) {
    assert.equal(e.description.is_summonable, true, 'the script spawns it');
    assert.equal(e.components['minecraft:damage_sensor'].triggers.deals_damage, 'no');
  }
});

test('entities: the return body wears the in-flight model of TRDT-LOOK', () => {
  const clients = readdirSync(join(root, 'packs', 'resource', 'entity')).map((f) => readJson('packs', 'resource', 'entity', f)['minecraft:client_entity']?.description);
  const flying = clients.find((d) => d?.identifier === 'andrew:trident_in_flight');
  const returning = clients.find((d) => d?.identifier === 'andrew:trident_returning');
  assert.ok(flying && returning);
  const { identifier: _a, ...f } = flying;
  const { identifier: _b, ...r } = returning;
  assert.deepEqual(r, f);
});
