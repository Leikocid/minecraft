// The binding belongs to a living player (spec v3 §7; C-45, L0-pear-ru01, L0-pear-ent2), off the engine: the honour
// table and the life epoch, and src/pearl/owner.ts with src/pearl/bind.ts against a stand-in @minecraft/server — a
// death bumps the epoch once and touches no item, a stranger's hit overwrites the binder, a trip listener hears the death.

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

test('a trip goes on only while its traveller is alive and in the life it started in', () => {
  assert.equal(R.tripSurvives(4, { health: 20, epoch: 4 }), true);
  assert.equal(R.tripSurvives(4, { health: 0.5, epoch: 4 }), true, 'half a heart is alive');
  assert.equal(R.tripSurvives(4, { health: 20, epoch: R.nextLifeEpoch(4) }), false, 'died and respawned since the use');
  // BDS 1.26.51.1: a death reads hp 0 in the tick's interval before its entityDie, so the epoch is still the old one.
  assert.equal(R.tripSurvives(4, { health: 0, epoch: 4 }), false, 'dead, entityDie not delivered yet');
  assert.equal(R.tripSurvives(0, { health: 0, epoch: 1 }), false);
});

// ------------------------------------------------------------------ owner.ts and bind.ts on a stand-in engine

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = (globalThis.__owner = { intervals: [], worldDp: new Map(), die: [] });
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
          afterEvents: {
            playerInventoryItemChange: { subscribe(cb) { return cb; } },
            itemUse: { subscribe(cb) { return cb; } },
            entitySpawn: { subscribe(cb) { H.spawn = cb; return cb; } },
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

const blocks = new Map();
const overworld = { id: 'minecraft:overworld', getBlock: (c) => ({ typeId: blocks.get(`${c.x},${c.y},${c.z}`) ?? 'minecraft:air' }) };

/** A player whose inventory and dynamic properties count every access, so a death that searches items shows. */
function fakePlayer(name) {
  const items = new Array(36).fill(undefined);
  const dp = new Map();
  const touched = { inventory: 0 };
  const container = { size: 36, getItem: (i) => items[i]?.clone(), setItem: (i, s) => { items[i] = s?.clone(); } };
  return Object.assign(new O.Player(), {
    name, id: `id-${name}`, typeId: 'minecraft:player', isValid: true, selectedSlotIndex: 0, items, dp, touched,
    getComponent: (id) => {
      if (id === 'minecraft:inventory') touched.inventory++;
      return id === 'minecraft:inventory' ? { container } : undefined;
    },
    getDynamicProperty: (k) => dp.get(k),
    setDynamicProperty: (k, v) => { dp.set(k, v); },
    onScreenDisplay: { setActionBar() {} },
  });
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
  H.spawn({ entity: h });
  tick();
  tick();
  assert.equal(h.isValid, false, `${owner.name}'s hook did not bind`);
}

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

test('stillInLife: alive in the same epoch; not once health reads 0, the epoch moved, or the player is gone', () => {
  const p = fakePlayer('traveller');
  let hp = 20;
  p.getComponent = (id) => (id === 'minecraft:health' ? { currentValue: hp } : undefined);
  assert.equal(O.stillInLife(p, 0), true);
  hp = 0;
  assert.equal(O.stillInLife(p, 0), false, 'the death tick, before entityDie');
  hp = 20;
  die(p);
  assert.equal(O.stillInLife(p, 0), false, 'respawned in a new life');
  assert.equal(O.stillInLife(p, 1), true);
  p.isValid = false;
  assert.equal(O.stillInLife(p, 1), false, 'logged out');
});
