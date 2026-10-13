// The binding belongs to a living player (spec v3 §7; C-45, L0-pear-ru01, L0-pear-ent2), off the engine: the honour
// table and the life epoch, and src/pearl/owner.ts with src/pearl/bind.ts against a stand-in @minecraft/server — a
// death bumps the epoch once and touches no item, a stranger's hit overwrites the binder, and a dead record is erased
// when the rod turns up with its binder online.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asModule = (text) => import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));

const rulesBundle = await build({
  entryPoints: [join(root, 'src', 'pearl', 'owner-rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const R = await asModule(rulesBundle.outputFiles[0].text);

const BOUND = {
  dim: 'minecraft:overworld',
  pos: { x: 10, y: 64, z: -3 },
  type: 'minecraft:stone_pressure_plate',
  owner: '-4294967295',
  epoch: 2,
  gen: 0,
};

// ------------------------------------------------------------------ the honour table (L0-pear-ru01 items 1, 2)

test('owner-rules imports nothing from the engine', () => {
  assert.doesNotMatch(rulesBundle.outputFiles[0].text, /@minecraft\//);
});

test('a binding is honoured only for its binder in the same life', () => {
  assert.equal(R.honourOf(BOUND, { id: BOUND.owner, epoch: 2 }), 'honoured');
  assert.equal(R.isHonoured(BOUND, { id: BOUND.owner, epoch: 2 }), true);
});

test('another holder is foreign whatever their epoch, even one that happens to equal the binder\'s', () => {
  for (const epoch of [0, 1, 2, 3]) {
    assert.equal(R.honourOf(BOUND, { id: '-4294967294', epoch }), 'foreign', `epoch ${epoch}`);
    assert.equal(R.isHonoured(BOUND, { id: '-4294967294', epoch }), false);
  }
});

test('the binder after a death is in a past life: the binding is not honoured, in either direction of a mismatch', () => {
  assert.equal(R.honourOf(BOUND, { id: BOUND.owner, epoch: 3 }), 'past-life');
  assert.equal(R.honourOf(BOUND, { id: BOUND.owner, epoch: 1 }), 'past-life', 'an epoch below the record is no better');
  assert.equal(R.isHonoured(BOUND, { id: BOUND.owner, epoch: 3 }), false);
});

test('an unbound rod is unbound for everyone', () => {
  assert.equal(R.honourOf(undefined, { id: BOUND.owner, epoch: 2 }), 'unbound');
  assert.equal(R.isHonoured(undefined, { id: BOUND.owner, epoch: 2 }), false);
});

// ------------------------------------------------------------------ the life epoch (C-45, L0-pear-ent2)

test('a death writes one past the stored epoch; a missing or garbled value counts as 0, as a binding reads it', () => {
  assert.equal(R.nextLifeEpoch(undefined), 1, 'a player who never died');
  assert.equal(R.nextLifeEpoch(0), 1);
  assert.equal(R.nextLifeEpoch(1), 2);
  assert.equal(R.nextLifeEpoch(41), 42);
  for (const garbled of ['3', Number.NaN, Number.POSITIVE_INFINITY, true, { x: 1 }]) {
    assert.equal(R.nextLifeEpoch(garbled), 1, JSON.stringify(garbled) ?? String(garbled));
  }
});

test('every death voids a binding made before it, however many deaths pass', () => {
  let epoch = 0;
  const made = { ...BOUND, epoch };
  for (let deaths = 1; deaths <= 5; deaths++) {
    epoch = R.nextLifeEpoch(epoch);
    assert.equal(R.honourOf(made, { id: BOUND.owner, epoch }), 'past-life', `after ${deaths} death(s)`);
  }
  assert.equal(R.honourOf({ ...BOUND, epoch }, { id: BOUND.owner, epoch }), 'honoured', 'a binding made in the current life');
});

test('a record is dead only once its binder is known to be in a later life', () => {
  assert.equal(R.isDeadRecord(BOUND, 3), true, 'the binder died since');
  assert.equal(R.isDeadRecord(BOUND, 9), true);
  assert.equal(R.isDeadRecord(BOUND, 2), false, 'the binder in the same life');
  assert.equal(R.isDeadRecord(BOUND, 1), false, 'an epoch below the record is not proof of a death');
  assert.equal(R.isDeadRecord(BOUND, undefined), false, 'the binder is offline: unknown, keep it');
  assert.equal(R.isDeadRecord(undefined, 5), false, 'nothing to erase');
});

// ------------------------------------------------------------------ owner.ts and bind.ts on a stand-in engine

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = (globalThis.__owner = { intervals: [], worldDp: new Map(), die: [], invChange: [], spawn: [], players: new Map() });
        export class Player {}
        export class ItemStack {
          constructor(typeId, amount = 1) {
            this.typeId = typeId; this.amount = amount; this.nameTag = undefined; this.lore = []; this.dp = new Map();
            this.maxAmount = typeId === 'minecraft:fishing_rod' ? 1 : 64;
            this.durability = typeId === 'minecraft:fishing_rod' ? { damage: 0, maxDurability: 384 } : undefined;
          }
          clone() {
            const c = Object.create(ItemStack.prototype);
            Object.assign(c, this, { lore: [...this.lore], dp: new Map(this.dp), durability: this.durability && { ...this.durability } });
            return c;
          }
          setLore(l) { this.lore = [...l]; }
          getLore() { return [...this.lore]; }
          setDynamicProperty(k, v) { if (this.maxAmount !== 1) throw new Error('stackable'); this.dp.set(k, v); }
          getDynamicProperty(k) { if (this.maxAmount !== 1) throw new Error('stackable'); return this.dp.get(k); }
          getComponent(id) { return id === 'minecraft:durability' ? this.durability : undefined; }
        }
        export const world = {
          getAbsoluteTime: () => 99,
          getAllPlayers: () => [],
          getDynamicProperty: (k) => H.worldDp.get(k),
          setDynamicProperty: (k, v) => (v === undefined ? H.worldDp.delete(k) : H.worldDp.set(k, v)),
          getDynamicPropertyIds: () => [...H.worldDp.keys()],
          getEntity: (id) => H.players.get(id),
          afterEvents: {
            playerInventoryItemChange: { subscribe(cb) { H.invChange.push(cb); return cb; } },
            playerSpawn: { subscribe(cb) { H.spawn.push(cb); return cb; } },
            itemUse: { subscribe(cb) { return cb; } },
            entitySpawn: { subscribe(cb) { H.entitySpawn = cb; return cb; } },
            projectileHitEntity: { subscribe(cb) { H.hitEntity = cb; return cb; } },
            entityDie: { subscribe(cb) { H.die.push(cb); return cb; } },
          },
        };
        export const system = {
          run() {}, runTimeout() {},
          runInterval(cb, t) { H.intervals.push([cb, t]); },
        };
      `,
    }));
  },
};

const ownerBundle = await build({
  stdin: {
    contents: [
      "export * from './src/pearl/owner.ts';",
      "export { bindingOf, bindStats, registerPearlBind } from './src/pearl/bind.ts';",
      "export { makePearlRod } from './src/pearl/item.ts';",
      "export { Player } from '@minecraft/server';",
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
const O = await asModule(ownerBundle.outputFiles[0].text);
const H = globalThis.__owner;
O.registerPearlBind();
O.registerPearlOwner();
const [tick] = H.intervals[0];
const die = (deadEntity) => { for (const cb of H.die) cb({ deadEntity, damageSource: { cause: 'entityAttack' } }); };
/** The engine's inventory-change event for the stack now in `slot` of `player`'s inventory. */
const arrived = (player, slot) => { for (const cb of H.invChange) cb({ player, slot, inventoryType: 'Inventory', itemStack: player.items[slot]?.clone() }); };
const spawned = (player, initialSpawn = false) => { for (const cb of H.spawn) cb({ player, initialSpawn }); };

const blocks = new Map();
const overworld = { id: 'minecraft:overworld', getBlock: (c) => ({ typeId: blocks.get(`${c.x},${c.y},${c.z}`) ?? 'minecraft:air' }) };

/** A player whose inventory and dynamic properties count every access, so a death that searches items shows. */
function fakePlayer(name) {
  const items = new Array(36).fill(undefined);
  const dp = new Map();
  const touched = { inventory: 0 };
  const container = { size: 36, getItem: (i) => items[i]?.clone(), setItem: (i, s) => { items[i] = s?.clone(); } };
  const p = Object.assign(new O.Player(), {
    name, id: `id-${name}`, typeId: 'minecraft:player', isValid: true, selectedSlotIndex: 0, items, dp, touched,
    getComponent: (id) => {
      if (id === 'minecraft:inventory') touched.inventory++;
      return id === 'minecraft:inventory' ? { container } : undefined;
    },
    getDynamicProperty: (k) => dp.get(k),
    setDynamicProperty: (k, v) => { dp.set(k, v); },
    onScreenDisplay: { setActionBar() {} },
  });
  H.players.set(p.id, p);
  return p;
}

let hookIds = 0;
/** One cast from `owner`'s selected slot that rests in the plate at `cell` and is confirmed. */
function bindInto(owner, cell) {
  blocks.set(`${cell.x},${cell.y},${cell.z}`, 'minecraft:stone_pressure_plate');
  const h = {
    typeId: 'minecraft:fishing_hook', id: `hook-${++hookIds}`, isValid: true, isOnGround: true, dimension: overworld,
    location: { x: cell.x + 0.5, y: cell.y, z: cell.z + 0.5 }, getVelocity: () => ({ x: 0, y: 0, z: 0 }),
    getComponent: (id) => (id === 'minecraft:projectile' ? { owner } : undefined),
    remove() { this.isValid = false; },
  };
  H.entitySpawn({ entity: h });
  tick();
  tick();
  assert.equal(h.isValid, false, `${owner.name}'s hook did not bind`);
}

test('arming twice subscribes once: one death, one bump', () => {
  const subs = H.die.length;
  O.registerPearlOwner();
  assert.equal(H.die.length, subs);
});

test('a player death bumps that player\'s epoch by one, every time, and nobody else\'s', () => {
  const a = fakePlayer('dies');
  const b = fakePlayer('bystander');
  const deaths0 = O.ownerStats.deaths;
  die(a);
  assert.equal(a.dp.get('andrew:life_epoch'), 1);
  die(a);
  die(a);
  assert.equal(a.dp.get('andrew:life_epoch'), 3);
  assert.equal(b.dp.get('andrew:life_epoch'), undefined);
  assert.equal(O.ownerStats.deaths - deaths0, 3);
});

test('a death of anything that is not a readable live player changes nothing', () => {
  const deaths0 = O.ownerStats.deaths;
  die(undefined);
  die({ typeId: 'minecraft:zombie', isValid: true, id: 'z' });
  die({ typeId: 'minecraft:player', isValid: true, id: 'unbound-sim' });
  const removed = fakePlayer('removed');
  removed.isValid = false;
  removed.setDynamicProperty = () => { throw new Error('setDynamicProperty on a removed entity'); };
  die(removed);
  assert.equal(O.ownerStats.deaths, deaths0);
});

test('the binder\'s death voids every rod they bound without touching any of them', () => {
  blocks.clear();
  const a = fakePlayer('binder');
  a.items[0] = O.makePearlRod();
  a.items[1] = O.makePearlRod();
  bindInto(a, { x: 1, y: 2, z: 3 });
  a.selectedSlotIndex = 1;
  bindInto(a, { x: 4, y: 2, z: 3 });
  // One rod stays in the inventory, the other goes to a chest: a stack no player holds.
  const inHand = a.items[0];
  const inChest = a.items[1];
  a.items[1] = undefined;
  assert.equal(O.honourFor(a, inHand), 'honoured');
  assert.equal(O.honourFor(a, inChest), 'honoured');
  assert.equal(O.honouredBindingOf(a, inChest)?.owner, 'id-binder');
  const before = [inHand, inChest].map((s) => [...s.dp.entries()]);
  const looks = a.touched.inventory;
  die(a);
  assert.equal(a.touched.inventory, looks, 'the death searched the inventory');
  assert.deepEqual([inHand, inChest].map((s) => [...s.dp.entries()]), before, 'the death rewrote a rod');
  assert.equal(O.honourFor(a, inHand), 'past-life');
  assert.equal(O.honourFor(a, inChest), 'past-life');
  assert.equal(O.honouredBindingOf(a, inChest), undefined);
  assert.equal(O.bindingOf(inChest).owner, 'id-binder', 'the record stays on the rod; it is only not honoured');
});

test('a rod back in its binder\'s hands after a death needs a new binding, which is honoured again', () => {
  blocks.clear();
  const a = fakePlayer('returns');
  a.items[0] = O.makePearlRod();
  bindInto(a, { x: 2, y: 2, z: 2 });
  die(a);
  assert.equal(O.honourFor(a, a.items[0]), 'past-life');
  bindInto(a, { x: 3, y: 2, z: 5 });
  const b = O.bindingOf(a.items[0]);
  assert.deepEqual([b.pos, b.epoch], [{ x: 3, y: 2, z: 5 }, 1]);
  assert.equal(O.honourFor(a, a.items[0]), 'honoured');
});

test('a stranger holding the rod is foreign; their own hit overwrites the binder, and the binder is foreign then', () => {
  blocks.clear();
  const a = fakePlayer('first');
  const b = fakePlayer('second');
  die(b);
  die(b);
  a.items[0] = O.makePearlRod();
  bindInto(a, { x: 1, y: 2, z: 1 });
  b.items[4] = a.items[0];
  a.items[0] = undefined;
  b.selectedSlotIndex = 4;
  assert.equal(O.honourFor(b, b.items[4]), 'foreign');
  assert.equal(O.honouredBindingOf(b, b.items[4]), undefined);
  bindInto(b, { x: 5, y: 2, z: 5 });
  const rec = O.bindingOf(b.items[4]);
  assert.deepEqual([rec.owner, rec.epoch, rec.pos], ['id-second', 2, { x: 5, y: 2, z: 5 }]);
  assert.equal(O.honourFor(b, b.items[4]), 'honoured');
  assert.equal(O.honourFor(a, b.items[4]), 'foreign');
});

const RECORD_KEYS = ['andrew:pr_dim', 'andrew:pr_pos', 'andrew:pr_type', 'andrew:pr_owner', 'andrew:pr_epoch', 'andrew:pr_gen'];
const recordKeysOn = (stack) => RECORD_KEYS.filter((k) => stack.getDynamicProperty(k) !== undefined);

test('a dead record is erased when the rod reaches an inventory: the binder\'s own, or a stranger\'s while the binder is online', () => {
  blocks.clear();
  const a = fakePlayer('dead_binder');
  const b = fakePlayer('finder');
  a.items[0] = O.makePearlRod();
  a.items[1] = O.makePearlRod();
  bindInto(a, { x: 1, y: 2, z: 1 });
  a.selectedSlotIndex = 1;
  bindInto(a, { x: 2, y: 2, z: 2 });
  const live0 = O.ownerStats.cleared;
  arrived(a, 0);
  assert.equal(O.ownerStats.cleared, live0, 'a record in its binder\'s life is kept');
  b.items[3] = a.items[1];
  a.items[1] = undefined;
  die(a);
  // The binder picks one rod up again; the stranger holds the other.
  arrived(a, 0);
  assert.deepEqual(recordKeysOn(a.items[0]), []);
  assert.deepEqual(a.items[0].getLore(), ['Pearl Rod', 'unbound']);
  assert.equal(O.honourFor(a, a.items[0]), 'unbound');
  assert.equal(a.items[0].getDynamicProperty('andrew:pearl_rod') !== undefined, true, 'still a Pearl Rod');
  arrived(b, 3);
  assert.deepEqual(recordKeysOn(b.items[3]), [], 'the stranger\'s copy, binder online and dead since');
  assert.equal(O.ownerStats.cleared - live0, 2);
});

test('a dead record is erased while the binder is offline, from the world copy of their epoch; a live foreign one is never touched', () => {
  blocks.clear();
  const a = fakePlayer('away');
  const b = fakePlayer('keeper');
  a.items[0] = O.makePearlRod();
  bindInto(a, { x: 3, y: 2, z: 3 });
  b.items[0] = a.items[0];
  a.items[0] = undefined;
  const cleared0 = O.ownerStats.cleared;
  arrived(b, 0);
  assert.equal(O.honourFor(b, b.items[0]), 'foreign');
  assert.deepEqual(recordKeysOn(b.items[0]), RECORD_KEYS, 'the binder is alive: their binding stays theirs');
  H.players.delete(a.id);
  arrived(b, 0);
  assert.deepEqual(recordKeysOn(b.items[0]), RECORD_KEYS, 'the binder is offline and has not died: the record stays');
  H.players.set(a.id, a);
  die(a);
  H.players.delete(a.id);
  arrived(b, 0);
  assert.deepEqual(recordKeysOn(b.items[0]), [], 'the binder died, then left: the world copy of the epoch says so');
  assert.equal(O.ownerStats.cleared - cleared0, 1);
});

test('a dead record is kept while no copy of the binder\'s epoch can be read: offline, and dead only on the player copy', () => {
  blocks.clear();
  const a = fakePlayer('legacy');
  const b = fakePlayer('holder');
  a.items[0] = O.makePearlRod();
  bindInto(a, { x: 7, y: 2, z: 7 });
  b.items[0] = a.items[0];
  a.items[0] = undefined;
  // A death recorded the way worlds saved before the world copy hold it: on the player only.
  a.dp.set('andrew:life_epoch', 1);
  assert.equal(O.honourFor(a, b.items[0]), 'past-life');
  H.players.delete(a.id);
  const cleared0 = O.ownerStats.cleared;
  arrived(b, 0);
  assert.deepEqual(recordKeysOn(b.items[0]), RECORD_KEYS, 'nobody can tell: the record stays (it is void all the same)');
  H.players.set(a.id, a);
  arrived(b, 0);
  assert.deepEqual(recordKeysOn(b.items[0]), [], 'the binder is back online: the player copy says so');
  assert.equal(O.ownerStats.cleared - cleared0, 1);
});

test('a spawn sweeps the player\'s own inventory: rods kept through a death lose their dead records, live ones stay', () => {
  blocks.clear();
  const a = fakePlayer('keeps_inventory');
  const c = fakePlayer('other_binder');
  a.items[0] = O.makePearlRod();
  a.items[5] = O.makePearlRod();
  bindInto(a, { x: 4, y: 2, z: 4 });
  a.selectedSlotIndex = 5;
  bindInto(a, { x: 5, y: 2, z: 5 });
  c.items[0] = O.makePearlRod();
  bindInto(c, { x: 6, y: 2, z: 6 });
  a.items[9] = c.items[0];
  c.items[0] = undefined;
  die(a);
  spawned(a);
  assert.deepEqual([0, 5].map((i) => recordKeysOn(a.items[i]).length), [0, 0]);
  assert.deepEqual([0, 5].map((i) => a.items[i].getLore()[1]), ['unbound', 'unbound']);
  assert.equal(O.bindingOf(a.items[9]).owner, 'id-other_binder', 'a live binding of somebody else stays');
  spawned(a, true);
  assert.equal(O.bindingOf(a.items[9]).owner, 'id-other_binder');
});
