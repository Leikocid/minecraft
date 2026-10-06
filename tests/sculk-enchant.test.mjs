// The Piercing strip off the engine (spec §8, T15 node half; L0-sclk-r005, ad01, adr-scpi, K-sclk-8).
//
// src/sculk/enchant.ts is bundled with the real registry against an in-memory engine shaped by CNTR-SCLK-CX01:
// a slot read is a copy, a slot write raises playerInventoryItemChange again after the handler returns, the off hand
// raises no inventory event and refuses an item without allow_off_hand by returning false. The GameTest twin in
// src/gametest/sculk-enchant.ts puts pierced stacks into a SimulatedPlayer's inventory on BDS.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (outputFiles) => import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text, 'utf-8').toString('base64'));

const engineStub = `
const mc = (globalThis.__mcEnchant = { handlers: {}, tick: 0 });
const signal = (name) => ({
  subscribe(fn) { (mc.handlers[name] ??= []).push(fn); return fn; },
  unsubscribe(fn) { mc.handlers[name] = (mc.handlers[name] ?? []).filter((f) => f !== fn); },
});
export const world = { afterEvents: new Proxy({}, { get: (_, name) => signal(name) }) };
export const system = { get currentTick() { return mc.tick; } };
export const EntityComponentTypes = { Inventory: "minecraft:inventory", Equippable: "minecraft:equippable" };
export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };
`;
const stubs = {
  name: 'enchant-stubs',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'mc', namespace: 'enchant-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'enchant-stub' }, () => ({ contents: engineStub, loader: 'js' }));
  },
};
const enchant = await load(
  (await build({ entryPoints: [join(projectRoot, 'src', 'sculk', 'enchant.ts')], bundle: true, format: 'esm', platform: 'neutral', write: false, plugins: [stubs] })).outputFiles
);
const mc = globalThis.__mcEnchant;
const logs = [];
console.warn = (msg) => logs.push(String(msg));
enchant.registerEnchant();

const XBOW = 'andrew:sculk_crossbow';
const VANILLA = 'minecraft:crossbow';
const PIERCED = [['piercing', 4], ['quick_charge', 3], ['unbreaking', 3]];

/** An ItemStack as far as the strip reads it: enchantments and the dynamic properties a mark lives in. */
class Stack {
  constructor(typeId, enchants = [], props = {}) {
    this.typeId = typeId;
    this.ench = new Map(enchants);
    this.props = { ...props };
  }
  clone() {
    return new Stack(this.typeId, [...this.ench], this.props);
  }
  getComponent(name) {
    if (name !== 'minecraft:enchantable' || this.typeId === 'andrew:web_sword_crafted') return undefined;
    const ench = this.ench;
    return {
      getEnchantment: (id) => (ench.has(id) ? { type: { id }, level: ench.get(id) } : undefined),
      getEnchantments: () => [...ench].map(([id, level]) => ({ type: { id }, level })),
      removeEnchantment: (id) => void ench.delete(id),
    };
  }
}

const list = (stack) => (stack === undefined ? 'empty' : [...stack.ench].map(([id, l]) => `${id}${l}`).sort().join('+'));

/** After-events of the tick, delivered once the current handler returns, as the engine does. */
const queue = [];
function deliver(name, event) {
  queue.push([name, event]);
}
function flush() {
  for (let guard = 0; queue.length > 0; guard++) {
    assert.ok(guard < 50, 'the events never settle: the strip feeds itself');
    const [name, event] = queue.shift();
    for (const fn of mc.handlers[name] ?? []) fn(event);
  }
}

function makePlayer(name, { offhandAdmits = true } = {}) {
  const slots = new Array(36).fill(undefined);
  let offhand;
  const writes = [];
  const player = {
    id: `id-${name}`,
    name,
    isValid: true,
    writes,
    slots,
    get offhand() {
      return offhand;
    },
    getComponent(type) {
      if (type === 'minecraft:inventory') {
        return {
          container: {
            size: slots.length,
            getItem: (i) => slots[i]?.clone(),
            setItem: (i, stack) => {
              const before = slots[i];
              slots[i] = stack?.clone();
              writes.push(`slot ${i}`);
              deliver('playerInventoryItemChange', { player, slot: i, itemStack: stack?.clone(), beforeItemStack: before, inventoryType: i < 9 ? 'Hotbar' : 'Inventory' });
            },
          },
        };
      }
      if (type === 'minecraft:equippable') {
        return {
          getEquipment: (slot) => (slot === 'Offhand' ? offhand?.clone() : undefined),
          setEquipment: (slot, stack) => {
            if (slot !== 'Offhand' || !offhandAdmits) return false;
            offhand = stack?.clone();
            writes.push('offhand');
            return true;
          },
        };
      }
      return undefined;
    },
  };
  return player;
}

/** A stack arriving in `slot` the way the engine reports it. */
function arrive(player, slot, stack) {
  player.slots[slot] = stack.clone();
  deliver('playerInventoryItemChange', { player, slot, itemStack: stack.clone(), beforeItemStack: undefined, inventoryType: slot < 9 ? 'Hotbar' : 'Inventory' });
  flush();
}

function watch() {
  const reports = [];
  const stop = enchant.observeStrips((r) => reports.push(r));
  logs.length = 0;
  return { reports, stop };
}

test('stripPiercing: only Piercing, only on the Sculk Crossbow, and the rest of the stack stays', () => {
  const pierced = new Stack(XBOW, PIERCED, { 'andrew:sk_id': 'i1', 'andrew:sk_gen': 2 });
  assert.equal(enchant.stripPiercing(pierced), 4);
  assert.equal(list(pierced), 'quick_charge3+unbreaking3');
  assert.deepEqual(pierced.props, { 'andrew:sk_id': 'i1', 'andrew:sk_gen': 2 });
  assert.equal(enchant.stripPiercing(pierced), 0, 'a second strip finds nothing');

  const multishot = new Stack(XBOW, [['multishot', 1], ['quick_charge', 3]]);
  assert.equal(enchant.stripPiercing(multishot), 0);
  assert.equal(list(multishot), 'multishot1+quick_charge3', 'Multishot and Quick Charge are never touched');

  const vanilla = new Stack(VANILLA, PIERCED);
  assert.equal(enchant.stripPiercing(vanilla), 0);
  assert.equal(list(vanilla), 'piercing4+quick_charge3+unbreaking3', 'a vanilla crossbow keeps its Piercing');

  assert.equal(enchant.stripPiercing(new Stack('andrew:web_sword', [['sharpness', 5]])), 0);
  assert.equal(enchant.stripPiercing(new Stack('andrew:web_sword_crafted')), 0, 'no enchantable component');
  assert.equal(enchant.stripPiercing(undefined), 0);
});

test('r005: a pierced crossbow entering any slot loses Piercing in the event tick, once, keeping the rest and the mark', () => {
  const { reports, stop } = watch();
  const p = makePlayer('Alex');
  mc.tick = 100;
  arrive(p, 20, new Stack(XBOW, PIERCED, { 'andrew:sk_id': 'i2' }));
  stop();
  assert.equal(list(p.slots[20]), 'quick_charge3+unbreaking3');
  assert.deepEqual(p.slots[20].props, { 'andrew:sk_id': 'i2' }, 'the instance mark rides along');
  assert.deepEqual(p.writes, ['slot 20'], 'one write; the event it raises finds nothing to strip');
  assert.equal(reports.length, 1);
  assert.deepEqual({ ...reports[0] }, { playerId: 'id-Alex', playerName: 'Alex', where: 20, trigger: 'inventory', level: 4, kept: ['quick_charge3', 'unbreaking3'], tick: 100 });
  assert.ok(logs.some((l) => l === '[andrew] sculk: stripped piercing 4 from Alex (slot 20, inventory); kept quick_charge3+unbreaking3'), logs.join('\n'));
});

test('r005: stacks the strip leaves alone raise no write and no report', () => {
  const { reports, stop } = watch();
  const p = makePlayer('Steve');
  arrive(p, 0, new Stack(XBOW, [['multishot', 1], ['quick_charge', 3], ['unbreaking', 3]]));
  arrive(p, 1, new Stack(VANILLA, PIERCED));
  arrive(p, 2, new Stack(XBOW));
  arrive(p, 3, new Stack('minecraft:bow', [['power', 5]]));
  stop();
  assert.deepEqual(p.writes, []);
  assert.equal(reports.length, 0);
  assert.equal(list(p.slots[0]), 'multishot1+quick_charge3+unbreaking3');
  assert.equal(list(p.slots[1]), 'piercing4+quick_charge3+unbreaking3');
});

test('r005: the event reads the live slot, so it never writes back an older copy than the slot holds', () => {
  const { reports, stop } = watch();
  const p = makePlayer('Kai');
  p.slots[5] = new Stack(XBOW, PIERCED, { 'andrew:sk_holder': 'id-Kai' });
  // The event still names the stack as it arrived, before another handler stamped the slot.
  deliver('playerInventoryItemChange', { player: p, slot: 5, itemStack: new Stack(XBOW, PIERCED), beforeItemStack: undefined, inventoryType: 'Hotbar' });
  flush();
  stop();
  assert.deepEqual(p.slots[5].props, { 'andrew:sk_holder': 'id-Kai' });
  assert.equal(list(p.slots[5]), 'quick_charge3+unbreaking3');
  assert.equal(reports.length, 1);
});

test('r005: the hand trigger strips the selected slot and the off hand, which no inventory event names', () => {
  const { reports, stop } = watch();
  const p = makePlayer('Noor');
  p.slots[4] = new Stack(XBOW, PIERCED);
  p.getComponent('minecraft:equippable').setEquipment('Offhand', new Stack(XBOW, [['piercing', 2], ['quick_charge', 1]], { 'andrew:sk_id': 'off' }));
  p.writes.length = 0;
  mc.tick = 200;
  deliver('playerHotbarSelectedSlotChange', { player: p, newSlotSelected: 4, previousSlotSelected: 0, itemStack: p.slots[4].clone() });
  flush();
  stop();
  assert.equal(list(p.slots[4]), 'quick_charge3+unbreaking3');
  assert.equal(list(p.offhand), 'quick_charge1');
  assert.deepEqual(p.offhand.props, { 'andrew:sk_id': 'off' });
  assert.deepEqual(
    reports.map((r) => `${r.where}:${r.trigger}:${r.level}@${r.tick}`),
    ['4:hand:4@200', 'offhand:hand:2@200']
  );
  assert.ok(logs.some((l) => l.includes('stripped piercing 2 from Noor (off hand, hand)')), logs.join('\n'));
});

test('a refusing off hand, a missing player and a throwing slot are logged, never thrown', () => {
  const { reports, stop } = watch();
  const refusing = makePlayer('Ivy', { offhandAdmits: true });
  refusing.getComponent('minecraft:equippable').setEquipment('Offhand', new Stack(XBOW, PIERCED));
  const refused = { ...refusing, getComponent: (t) => (t === 'minecraft:equippable' ? { ...refusing.getComponent(t), setEquipment: () => false } : refusing.getComponent(t)) };
  deliver('playerHotbarSelectedSlotChange', { player: refused, newSlotSelected: 0, previousSlotSelected: 1 });
  flush();
  assert.ok(logs.some((l) => l.includes('the off hand of Ivy refused the crossbow without piercing; it keeps piercing 4')), logs.join('\n'));

  // A SimulatedPlayer seen from the release pack.
  deliver('playerInventoryItemChange', { player: undefined, slot: 0, itemStack: new Stack(XBOW, PIERCED) });
  deliver('playerHotbarSelectedSlotChange', { player: undefined, newSlotSelected: 0 });
  flush();

  const broken = { id: 'id-Bo', name: 'Bo', isValid: true, getComponent: () => ({ container: { size: 9, getItem: () => { throw new Error('invalid'); } } }) };
  deliver('playerInventoryItemChange', { player: broken, slot: 0, itemStack: new Stack(XBOW, PIERCED) });
  flush();
  assert.ok(logs.some((l) => l.includes('piercing strip on slot 0 for Bo threw Error: invalid')), logs.join('\n'));

  const gone = makePlayer('Gone');
  gone.isValid = false;
  arrive(gone, 0, new Stack(XBOW, PIERCED));
  assert.equal(list(gone.slots[0]), 'piercing4+quick_charge3+unbreaking3', 'an invalid player is not touched');
  stop();
  assert.equal(reports.length, 0);
});
