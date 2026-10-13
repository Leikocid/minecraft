// What a binding needs to be honoured after a world restart (spec v3 §7–§8, L0-pear-ac06), off the engine:
// src/pearl/store.ts against a stand-in @minecraft/server — the binder's key, the life epoch kept on the player and in
// the world, what survives when either copy is lost or garbled, and a restart replayed by reloading the module over
// the saved properties.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asModule = (text) => import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = globalThis.__store;
        export class Player {}
        export const world = {
          getDynamicProperty: (k) => H.worldDp.get(k),
          setDynamicProperty: (k, v) => (v === undefined ? H.worldDp.delete(k) : H.worldDp.set(k, v)),
          getDynamicPropertyIds: () => [...H.worldDp.keys()],
        };
      `,
    }));
  },
};

const bundle = await build({
  stdin: {
    contents: [
      "export * from './src/pearl/store.ts';",
      "export { honourOf, isDeadRecord } from './src/pearl/owner-rules.ts';",
      "export { LIFE_EPOCH_KEY, readBinding, bindingEntries } from './src/pearl/bind-rules.ts';",
    ].join('\n'),
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [stubPlugin],
});
const code = bundle.outputFiles[0].text;

/**
 * One script engine over `worldDp`: a fresh module instance, as a server start gives. Each load gets its own copy of
 * the module state (the key override), the way a restart drops everything but the saved properties.
 */
let loads = 0;
async function engine(worldDp = new Map()) {
  globalThis.__store = { worldDp };
  const S = await asModule(`${code}\n// load ${++loads}`);
  return { S, worldDp };
}

const { S } = await engine();
const EPOCH = S.LIFE_EPOCH_KEY;

function player(id, name = id, dp = new Map()) {
  return {
    id, name, dp,
    getDynamicProperty: (k) => dp.get(k),
    setDynamicProperty: (k, v) => { if (v === undefined) dp.delete(k); else dp.set(k, v); },
  };
}

/** Garbage a store can hand back: wrong types, negative, fractional, unsafe, non-finite. */
const GARBLED = ['3', '', true, null, { x: 1 }, [2], -1, -0.5, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53];

// ------------------------------------------------------------------ the key

test('the key is Player.id unless an override names the player', async () => {
  const { S } = await engine();
  const p = player('-4294967295', 'pps_a');
  assert.equal(S.playerKey(p), '-4294967295');
  S.setPlayerKeyOverride((q) => (q.name.startsWith('pps_') ? `gt:${q.name}` : undefined));
  assert.equal(S.playerKey(p), 'gt:pps_a');
  assert.equal(S.playerKey(player('-12', 'someone')), '-12', 'an undefined answer keeps the id');
  S.setPlayerKeyOverride(() => '');
  assert.equal(S.playerKey(p), '-4294967295', 'an empty key is no key');
  S.setPlayerKeyOverride(() => { throw new Error('the name of a removed entity does not read'); });
  assert.equal(S.playerKey(p), '-4294967295', 'a throwing override falls back to the id');
  S.setPlayerKeyOverride(undefined);
  assert.equal(S.playerKey(p), '-4294967295');
});

test('a fresh engine has no override: a restart never carries the GameTest key into the release pack', async () => {
  const { S: first } = await engine();
  first.setPlayerKeyOverride(() => 'gt:x');
  const { S: next } = await engine();
  assert.equal(next.playerKey(player('-7')), '-7');
});

// ------------------------------------------------------------------ the epoch value

test('a stored epoch is a whole number from 0 up; anything else reads as no value', () => {
  for (const ok of [0, 1, 41, 2 ** 53 - 1]) assert.equal(S.epochValue(ok), ok, String(ok));
  for (const bad of [undefined, ...GARBLED]) assert.equal(S.epochValue(bad), undefined, JSON.stringify(bad) ?? String(bad));
});

test('the merged epoch is the larger copy; a missing or garbled copy never lowers it', () => {
  assert.equal(S.mergedEpoch(undefined, undefined), 0);
  assert.equal(S.mergedEpoch(3, undefined), 3, 'the player copy alone (worlds saved before the world copy)');
  assert.equal(S.mergedEpoch(undefined, 3), 3, 'the world copy alone (a player whose own copy is gone)');
  assert.equal(S.mergedEpoch(2, 5), 5);
  assert.equal(S.mergedEpoch(5, 2), 5);
  for (const bad of GARBLED) {
    assert.equal(S.mergedEpoch(bad, 4), 4, `garbled player copy ${String(bad)}`);
    assert.equal(S.mergedEpoch(4, bad), 4, `garbled world copy ${String(bad)}`);
    assert.equal(S.mergedEpoch(bad, bad), 0, `both garbled ${String(bad)}`);
  }
});

// ------------------------------------------------------------------ reading and ending a life

test('the epoch is read from both copies, by the player\'s key', async () => {
  const { S, worldDp } = await engine();
  const p = player('-1');
  assert.equal(S.lifeEpochOf(p), 0, 'a player who never died');
  p.dp.set(EPOCH, 2);
  assert.equal(S.lifeEpochOf(p), 2);
  worldDp.set(S.epochKey('-1'), 4);
  assert.equal(S.lifeEpochOf(p), 4);
  assert.equal(S.storedEpoch('-1'), 4);
  assert.equal(S.storedEpoch('-2'), undefined, 'nobody stored under that key');
  S.setPlayerKeyOverride(() => 'gt:other');
  assert.equal(S.lifeEpochOf(p), 2, 'the world copy is looked up by the key, not the id');
});

test('a death writes one past the current epoch to both copies, whichever was ahead', async () => {
  const { S, worldDp } = await engine();
  const p = player('-3');
  assert.equal(S.endLife(p), 1);
  assert.deepEqual([p.dp.get(EPOCH), worldDp.get(S.epochKey('-3'))], [1, 1]);
  worldDp.set(S.epochKey('-3'), 6);
  assert.equal(S.endLife(p), 7, 'the world copy was ahead');
  assert.deepEqual([p.dp.get(EPOCH), worldDp.get(S.epochKey('-3'))], [7, 7]);
  p.dp.set(EPOCH, 9);
  assert.equal(S.endLife(p), 10, 'the player copy was ahead');
  assert.equal(worldDp.get(S.epochKey('-3')), 10);
});

test('a garbled copy is repaired by the next death and never brings an epoch down', async () => {
  const { S, worldDp } = await engine();
  for (const bad of GARBLED) {
    const p = player('-5');
    p.dp.set(EPOCH, bad);
    worldDp.set(S.epochKey('-5'), 3);
    assert.equal(S.lifeEpochOf(p), 3, `player copy ${String(bad)}`);
    assert.equal(S.endLife(p), 4);
    assert.deepEqual([p.dp.get(EPOCH), worldDp.get(S.epochKey('-5'))], [4, 4]);
    worldDp.set(S.epochKey('-5'), bad);
    assert.equal(S.lifeEpochOf(p), 4, `world copy ${String(bad)}`);
    assert.equal(S.storedEpoch('-5'), undefined, 'a garbled world copy is no stored epoch');
    p.dp.set(EPOCH, bad);
    assert.equal(S.lifeEpochOf(p), 0, 'both garbled: nothing to read');
    assert.equal(S.endLife(p), 1);
  }
});

// ------------------------------------------------------------------ a restart, replayed

const RECORD = {
  dim: 'minecraft:overworld',
  pos: { x: -43207, y: 100, z: 43213 },
  type: 'minecraft:stone_pressure_plate',
  owner: '-4294967295',
  epoch: 1,
  gen: 2,
};

/** The record as the rod's dynamic properties, saved and loaded the way the world saves them: plain values. */
const saved = (b) => new Map(JSON.parse(JSON.stringify(S.bindingEntries(b))));

test('a restart keeps what a client keeps: the record, the id and both copies — the binding is honoured, a past one is not', async () => {
  const worldDp = new Map();
  const { S: before } = await engine(worldDp);
  const binder = player(RECORD.owner);
  before.endLife(binder);
  const live = saved({ ...RECORD, epoch: before.lifeEpochOf(binder) });
  const dead = saved({ ...RECORD, epoch: 0 });

  const { S: after } = await engine(new Map(JSON.parse(JSON.stringify([...worldDp]))));
  const back = player(RECORD.owner, RECORD.owner, new Map(binder.dp));
  const holder = { id: after.playerKey(back), epoch: after.lifeEpochOf(back) };
  assert.equal(after.honourOf(after.readBinding((k) => live.get(k)), holder), 'honoured');
  assert.equal(after.honourOf(after.readBinding((k) => dead.get(k)), holder), 'past-life');
});

test('a restart that loses the player copy (a SimulatedPlayer) keeps the epoch through the world copy: nothing is revived', async () => {
  const worldDp = new Map();
  const { S: before } = await engine(worldDp);
  const binder = player(RECORD.owner);
  before.endLife(binder);
  before.endLife(binder);
  const dead = saved({ ...RECORD, epoch: 0 });
  const live = saved({ ...RECORD, epoch: 2 });

  const { S: after } = await engine(new Map(worldDp));
  const bare = player(RECORD.owner);
  assert.equal(after.lifeEpochOf(bare), 2);
  const holder = { id: after.playerKey(bare), epoch: after.lifeEpochOf(bare) };
  assert.equal(after.honourOf(after.readBinding((k) => dead.get(k)), holder), 'past-life', 'a binding of life 0 would come back with the epoch lost');
  assert.equal(after.honourOf(after.readBinding((k) => live.get(k)), holder), 'honoured');
  assert.equal(after.isDeadRecord(after.readBinding((k) => dead.get(k)), after.storedEpoch(RECORD.owner)), true, 'offline, the world copy still says the record is dead');
});

test('a death after the restart still voids a binding made before it', async () => {
  const worldDp = new Map();
  const { S: before } = await engine(worldDp);
  const binder = player(RECORD.owner);
  before.endLife(binder);
  const live = saved({ ...RECORD, epoch: 1 });

  const { S: after } = await engine(new Map(worldDp));
  const back = player(RECORD.owner, RECORD.owner, new Map(binder.dp));
  assert.equal(after.honourOf(after.readBinding((k) => live.get(k)), { id: after.playerKey(back), epoch: after.lifeEpochOf(back) }), 'honoured');
  assert.equal(after.endLife(back), 2);
  assert.equal(after.honourOf(after.readBinding((k) => live.get(k)), { id: after.playerKey(back), epoch: after.lifeEpochOf(back) }), 'past-life');
  assert.equal(after.storedEpoch(RECORD.owner), 2);
});

test('a garbled record that comes back from a restart is no binding: it is honoured for nobody and erased by nothing', async () => {
  const worldDp = new Map();
  const { S: before } = await engine(worldDp);
  const binder = player(RECORD.owner);
  before.endLife(binder);
  const whole = { ...RECORD, epoch: 1 };
  const garbled = [
    ['the epoch as text', { 'andrew:pr_epoch': '1' }],
    ['a fractional epoch', { 'andrew:pr_epoch': 1.5 }],
    ['no epoch', { 'andrew:pr_epoch': undefined }],
    ['the cell without z', { 'andrew:pr_pos': { x: RECORD.pos.x, y: RECORD.pos.y } }],
    ['a fractional cell', { 'andrew:pr_pos': { x: RECORD.pos.x + 0.5, y: RECORD.pos.y, z: RECORD.pos.z } }],
    ['the cell as text', { 'andrew:pr_pos': '-43207 100 43213' }],
    ['an empty owner', { 'andrew:pr_owner': '' }],
    ['a block that is no plate', { 'andrew:pr_type': 'minecraft:stone' }],
    ['no dimension', { 'andrew:pr_dim': undefined }],
    ['the generation as text', { 'andrew:pr_gen': '2' }],
  ];
  const { S: after } = await engine(new Map(worldDp));
  const back = player(RECORD.owner, RECORD.owner, new Map(binder.dp));
  const holder = { id: after.playerKey(back), epoch: after.lifeEpochOf(back) };
  const props = saved(whole);
  assert.equal(after.honourOf(after.readBinding((k) => props.get(k)), holder), 'honoured', 'control: the whole record');
  for (const [what, change] of garbled) {
    const p = new Map(props);
    for (const [k, v] of Object.entries(change)) (v === undefined ? p.delete(k) : p.set(k, v));
    const read = after.readBinding((k) => p.get(k));
    assert.equal(read, undefined, `${what}: read as a binding`);
    assert.equal(after.honourOf(read, holder), 'unbound', what);
    assert.equal(after.isDeadRecord(read, after.storedEpoch(RECORD.owner)), false, `${what}: nothing to erase`);
  }
});
