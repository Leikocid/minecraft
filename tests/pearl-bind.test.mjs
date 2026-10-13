// The binding (spec v3 §7, unbound state; L0-xasm41, L0-pear-ent1, L0-pear-pr02), off the engine: the hit rules on
// the trajectories the probe measured, the record and its lore, and src/pearl/bind.ts against a stand-in
// @minecraft/server — owner by projectile, the rod found by its id, the hook removed, one binding per rod.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asModule = (text) => import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));

const rulesBundle = await build({
  entryPoints: [join(root, 'src', 'pearl', 'bind-rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const R = await asModule(rulesBundle.outputFiles[0].text);

/** All 17 `*pressure_plate` types of 1.26.51 (probe Q2, BlockTypes.getAll()). */
const PLATES = [
  'acacia', 'bamboo', 'birch', 'cherry', 'crimson', 'dark_oak', 'heavy_weighted', 'jungle', 'light_weighted',
  'mangrove', 'pale_oak', 'polished_blackstone', 'poplar', 'spruce', 'stone', 'warped', 'wooden',
].map((p) => `minecraft:${p}_pressure_plate`);

const STILL = { x: 0, y: 0, z: 0 };
const FLYING = { x: 0, y: -0.45, z: 0.62 };
const hook = (location, velocity = STILL, extra = {}) => ({ location, velocity, onGround: false, inEntity: false, ...extra });

// ------------------------------------------------------------------ what a plate is, and which cell a hook is in

test('bind-rules imports nothing from the engine', () => {
  assert.doesNotMatch(rulesBundle.outputFiles[0].text, /@minecraft\//);
});

test('every vanilla plate type is a plate; nothing else is', () => {
  for (const id of PLATES) assert.ok(R.isPlateType(id), id);
  for (const id of ['minecraft:stone', 'minecraft:air', 'minecraft:water', 'minecraft:stone_button', 'minecraft:pressure_plate_x',
    'andrew:copper_pressure_plate', '', undefined]) {
    assert.equal(R.isPlateType(id), false, String(id));
  }
});

test('the hook cell: floor of x and z, and floor of y read so that a hook resting on the support names the plate', () => {
  assert.deepEqual(R.hookCell({ x: 3.5, y: 2.0, z: 3.9129 }), { x: 3, y: 2, z: 3 }, 'probe Q1 rest point');
  assert.deepEqual(R.hookCell({ x: 3.5, y: 2.43, z: 2.2 }), { x: 3, y: 2, z: 2 });
  assert.deepEqual(R.hookCell({ x: 3.5, y: 1.9995, z: 3.5 }), { x: 3, y: 2, z: 3 }, 'a hair below the support top is still the plate cell');
  assert.deepEqual(R.hookCell({ x: 3.5, y: 1.99, z: 3.5 }), { x: 3, y: 1, z: 3 }, 'a hundredth below is inside the support');
  assert.deepEqual(R.hookCell({ x: -0.5, y: -60, z: -10.2 }), { x: -1, y: -60, z: -11 }, 'negative coordinates floor down');
});

// ------------------------------------------------------------------ the verdict (xasm41)

test('a hook at rest in any plate cell binds; on the floor next to it, or in an unloaded cell, it does not', () => {
  for (const id of PLATES) assert.equal(R.hookVerdict(hook({ x: 3.5, y: 2, z: 3.9 }, STILL, { onGround: true }), id), 'bind', id);
  assert.equal(R.hookVerdict(hook({ x: 3.5, y: 2, z: 3.9 }, STILL, { onGround: true }), 'minecraft:air'), 'no-plate', 'adjacent cell, plate next door');
  assert.equal(R.hookVerdict(hook({ x: 3.5, y: 2, z: 3.9 }), undefined), 'no-plate', 'unloaded');
  assert.equal(R.hookVerdict(hook({ x: 3.5, y: 2.6, z: 3.9 }), 'minecraft:water'), 'no-plate', 'floating in water over a plate');
});

test('the threshold: within 0.25 of the cell floor binds even in motion; above it only a stopped or grounded hook binds', () => {
  const plate = 'minecraft:stone_pressure_plate';
  assert.equal(R.BIND_DY, 0.25);
  assert.equal(R.hookVerdict(hook({ x: 0.5, y: 5.25, z: 0.5 }, FLYING), plate), 'bind', 'exactly 0.25');
  assert.equal(R.hookVerdict(hook({ x: 0.5, y: 5.2501, z: 0.5 }, FLYING), plate), 'in-flight');
  assert.equal(R.hookVerdict(hook({ x: 0.5, y: 5.7, z: 0.5 }, { x: 0.03, y: 0, z: 0.03 }), plate), 'bind', '|v| 0.042 < 0.05');
  assert.equal(R.hookVerdict(hook({ x: 0.5, y: 5.7, z: 0.5 }, { x: 0.04, y: 0, z: 0.04 }), plate), 'in-flight', '|v| 0.057');
  assert.equal(R.hookVerdict(hook({ x: 0.5, y: 5.7, z: 0.5 }, FLYING, { onGround: true }), plate), 'bind', 'on the ground');
});

test('the probe trajectories: in flight over plates at dy 0.91, 0.44 and 0.43 is no hit; the rest tick is', () => {
  const plate = 'minecraft:wooden_pressure_plate';
  // probe Q2: short cast "1:2.43p 2:2.00p", long cast "1:2.91p 2:2.44p 3:2.00p" (relative y, p = inside a plate cell).
  const long = [
    [hook({ x: 3.5, y: 2.91, z: 3.1 }, { x: 0, y: -0.48, z: 1.1 }), 'in-flight'],
    [hook({ x: 3.5, y: 2.44, z: 5.2 }, { x: 0, y: -0.52, z: 0.9 }), 'in-flight'],
    [hook({ x: 3.5, y: 2.0, z: 6.68 }, STILL, { onGround: true }), 'bind'],
  ];
  for (const [h, want] of long) assert.equal(R.hookVerdict(h, plate), want, `y=${h.location.y}`);
  assert.equal(R.hookVerdict(hook({ x: 3.5, y: 2.43, z: 2.2 }, FLYING), plate), 'in-flight');
});

test('a hook that hit an entity never binds, even at rest in a plate cell', () => {
  const h = hook({ x: 3.5, y: 2.72, z: 3.5 }, STILL, { inEntity: true });
  assert.equal(R.hookVerdict(h, 'minecraft:stone_pressure_plate'), 'in-entity');
  assert.equal(R.hookVerdict({ ...h, location: { x: 3.5, y: 2, z: 3.5 }, onGround: true }, 'minecraft:stone_pressure_plate'), 'in-entity');
});

// ------------------------------------------------------------------ confirmation over consecutive checks

test('a hit is confirmed on the second consecutive bind verdict in the same cell', () => {
  assert.equal(R.HIT_CONFIRM_TICKS, 2);
  const c = { x: 3, y: 2, z: 6 };
  let w = R.nextHitWatch(R.NO_HIT, 'bind', c);
  assert.equal(R.isConfirmed(w), false, 'one check is not enough');
  w = R.nextHitWatch(w, 'bind', c);
  assert.equal(R.isConfirmed(w), true);
  assert.equal(R.isConfirmed(R.nextHitWatch(w, 'bind', c)), true);
});

test('a skim through the lowest quarter of a plate cell that lands next door is never confirmed', () => {
  let w = R.nextHitWatch(R.NO_HIT, 'bind', { x: 3, y: 2, z: 5 });
  w = R.nextHitWatch(w, 'no-plate', { x: 3, y: 2, z: 6 });
  assert.equal(R.isConfirmed(w), false);
  w = R.nextHitWatch(R.nextHitWatch(R.NO_HIT, 'bind', { x: 3, y: 2, z: 5 }), 'bind', { x: 3, y: 2, z: 6 });
  assert.equal(R.isConfirmed(w), false, 'two plate cells in a row is a new count, not a hit');
});

test('the entity race: a hook reading stopped in the tick it hooks a mob is dropped once the hit flag arrives', () => {
  const plate = 'minecraft:wooden_pressure_plate';
  const at = { x: 3.5, y: 2.72, z: 3.5 };
  let w = R.nextHitWatch(R.NO_HIT, R.hookVerdict(hook(at), plate), R.hookCell(at));
  assert.equal(w.ticks, 1);
  for (let t = 0; t < 40; t++) {
    w = R.nextHitWatch(w, R.hookVerdict(hook(at, STILL, { inEntity: true }), plate), R.hookCell(at));
    assert.equal(R.isConfirmed(w), false);
  }
});

// ------------------------------------------------------------------ the record (L0-pear-ent1)

const SAMPLE = {
  dim: 'minecraft:overworld',
  pos: { x: 10, y: 64, z: -3 },
  type: 'minecraft:stone_pressure_plate',
  owner: '-4294967295',
  epoch: 2,
  gen: 0,
};

test('the record keys are the six of L0-pear-ent1, distinct, in order', () => {
  assert.deepEqual(R.BINDING_KEYS, ['andrew:pr_dim', 'andrew:pr_pos', 'andrew:pr_type', 'andrew:pr_owner', 'andrew:pr_epoch', 'andrew:pr_gen']);
  assert.deepEqual(R.bindingEntries(SAMPLE).map(([k]) => k), [...R.BINDING_KEYS]);
  assert.equal(R.LIFE_EPOCH_KEY, 'andrew:life_epoch');
});

test('a record written and read back is the same record', () => {
  const props = new Map(R.bindingEntries(SAMPLE));
  assert.deepEqual(R.readBinding((k) => props.get(k)), SAMPLE);
  assert.deepEqual(props.get('andrew:pr_pos'), { x: 10, y: 64, z: -3 }, 'the plate cell as a Vector3');
});

test('a partial or malformed record reads as unbound', () => {
  for (const key of R.BINDING_KEYS) {
    const props = new Map(R.bindingEntries(SAMPLE));
    props.delete(key);
    assert.equal(R.readBinding((k) => props.get(k)), undefined, `without ${key}`);
  }
  const bad = [
    ['andrew:pr_pos', { x: 10.5, y: 64, z: -3 }],
    ['andrew:pr_pos', 'x'],
    ['andrew:pr_type', 'minecraft:stone'],
    ['andrew:pr_dim', ''],
    ['andrew:pr_owner', 7],
    ['andrew:pr_epoch', 1.5],
    ['andrew:pr_gen', '0'],
  ];
  for (const [key, value] of bad) {
    const props = new Map(R.bindingEntries(SAMPLE));
    props.set(key, value);
    assert.equal(R.readBinding((k) => props.get(k)), undefined, `${key}=${JSON.stringify(value)}`);
  }
  assert.equal(R.readBinding(() => undefined), undefined, 'a fresh rod');
});

test('lore: the title, then the dimension and the plate cell; never the owner', () => {
  assert.deepEqual(R.boundLore(SAMPLE), ['Pearl Rod', 'bound: overworld 10 64 -3']);
  assert.deepEqual(R.boundLore({ ...SAMPLE, dim: 'minecraft:nether' })[1], 'bound: nether 10 64 -3');
  assert.deepEqual(R.boundLore({ ...SAMPLE, dim: 'minecraft:the_end' })[1], 'bound: the_end 10 64 -3');
  assert.ok(!R.boundLore(SAMPLE).join(' ').includes(SAMPLE.owner));
});

test('the generation key and missing counters', () => {
  assert.equal(R.generationKey('minecraft:overworld', { x: 1, y: -2, z: 3 }), 'andrew:pg:overworld:1:-2:3');
  assert.equal(R.generationKey('minecraft:the_end', { x: 0, y: 0, z: 0 }), 'andrew:pg:the_end:0:0:0');
  assert.equal(R.counterOf(undefined), 0);
  assert.equal(R.counterOf('3'), 0);
  assert.equal(R.counterOf(Number.NaN), 0);
  assert.equal(R.counterOf(3), 3);
});

// ------------------------------------------------------------------ bind.ts on a stand-in engine

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = (globalThis.__bind = { intervals: [], worldDp: new Map() });
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
          afterEvents: {
            playerInventoryItemChange: { subscribe(cb) { return cb; } },
            itemUse: { subscribe(cb) { return cb; } },
            entitySpawn: { subscribe(cb) { H.spawn = cb; return cb; } },
            projectileHitEntity: { subscribe(cb) { H.hitEntity = cb; return cb; } },
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

const bindBundle = await build({
  stdin: {
    contents: "export * from './src/pearl/bind.ts'; export { makePearlRod } from './src/pearl/item.ts'; export { ItemStack, Player } from '@minecraft/server';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [stubPlugin],
});
const B = await asModule(bindBundle.outputFiles[0].text);
const H = globalThis.__bind;
B.registerPearlBind();
const [tick, every] = H.intervals[0];

/** Blocks of the stand-in overworld, by "x,y,z". */
const blocks = new Map();
const overworld = { id: 'minecraft:overworld', getBlock: (c) => ({ typeId: blocks.get(`${c.x},${c.y},${c.z}`) ?? 'minecraft:air' }) };

function fakePlayer(name, epoch) {
  const items = new Array(36).fill(undefined);
  const container = { size: 36, getItem: (i) => items[i]?.clone(), setItem: (i, s) => { items[i] = s?.clone(); } };
  const bars = [];
  return Object.assign(new B.Player(), {
    name, id: `id-${name}`, isValid: true, selectedSlotIndex: 0, items, bars,
    getComponent: (id) => (id === 'minecraft:inventory' ? { container } : undefined),
    getDynamicProperty: (k) => (k === 'andrew:life_epoch' ? epoch : undefined),
    onScreenDisplay: { setActionBar: (m) => bars.push(m) },
  });
}

let hookIds = 0;
function cast(owner, at, velocity = STILL) {
  const h = {
    typeId: 'minecraft:fishing_hook', id: `hook-${++hookIds}`, isValid: true, location: at, isOnGround: false, dimension: overworld,
    velocity, getVelocity() { return this.velocity; },
    getComponent: (id) => (id === 'minecraft:projectile' ? { owner } : undefined),
    remove() { this.isValid = false; },
  };
  H.spawn({ entity: h });
  return h;
}

const run = (n) => { for (let i = 0; i < n; i++) tick(); };
const bindingIn = (p, slot) => B.bindingOf(p.items[slot]);

test('the check runs every tick', () => {
  assert.equal(every, 1);
});

test('a Pearl Rod hook resting in a plate binds that rod to the plate cell and is removed in the same check', () => {
  blocks.clear();
  for (const z of [3, 5, 6]) blocks.set(`3,2,${z}`, 'minecraft:birch_pressure_plate');
  blocks.set('3,1,6', 'minecraft:stone');
  H.worldDp.set('andrew:pg:overworld:3:2:6', 4);
  const p = fakePlayer('binder', 3);
  p.items[0] = B.makePearlRod();
  const h = cast(p, { x: 3.5, y: 2.91, z: 3.1 }, { x: 0, y: -0.5, z: 1 });
  run(1);
  h.location = { x: 3.5, y: 2.44, z: 5.2 };
  run(1);
  assert.equal(bindingIn(p, 0), undefined, 'in flight over plates: no binding');
  h.location = { x: 3.5, y: 2, z: 6.68 };
  h.velocity = STILL;
  h.isOnGround = true;
  run(1);
  assert.equal(bindingIn(p, 0), undefined, 'the first rest check only arms the confirmation');
  assert.equal(h.isValid, true);
  run(1);
  assert.deepEqual(bindingIn(p, 0), {
    dim: 'minecraft:overworld', pos: { x: 3, y: 2, z: 6 }, type: 'minecraft:birch_pressure_plate', owner: 'id-binder', epoch: 3, gen: 4,
  });
  assert.equal(h.isValid, false, 'the hook is removed in the check that binds');
  assert.deepEqual(p.items[0].getLore(), ['Pearl Rod', 'bound: overworld 3 2 6']);
  assert.deepEqual(p.bars, [{ translate: 'andrew.pearl_rod.bound' }]);
  H.worldDp.clear();
});

test('no binding: plain rod, a non-player owner, a hook next to a plate, a hook in a mob, a rod gone from the inventory', () => {
  blocks.clear();
  blocks.set('3,2,6', 'minecraft:stone_pressure_plate');
  const rest = { x: 3.5, y: 2, z: 6.5 };
  const plain = fakePlayer('plain');
  plain.items[0] = new B.ItemStack('minecraft:fishing_rod');
  const h1 = cast(plain, rest);
  const h2 = cast({ typeId: 'minecraft:skeleton', isValid: true }, rest);
  const adj = fakePlayer('adjacent');
  adj.items[0] = B.makePearlRod();
  const h3 = cast(adj, { x: 4.5, y: 2, z: 6.5 });
  const mob = fakePlayer('mob');
  mob.items[0] = B.makePearlRod();
  const h4 = cast(mob, { x: 3.5, y: 2.72, z: 6.5 });
  H.hitEntity({ projectile: h4 });
  const gone = fakePlayer('gone');
  gone.items[0] = B.makePearlRod();
  const h5 = cast(gone, rest);
  gone.items[0] = undefined;
  const binds = B.bindStats.binds;
  run(5);
  assert.equal(B.bindStats.binds, binds);
  assert.equal(plain.items[0].getDynamicProperty('andrew:pr_pos'), undefined);
  assert.equal(bindingIn(adj, 0), undefined);
  assert.equal(bindingIn(mob, 0), undefined);
  assert.deepEqual([h1, h2, h3, h4].map((h) => h.isValid), [true, true, true, true], 'hooks that do not bind are left to vanilla');
  assert.equal(h5.isValid, true);
});

test('one binding per rod: a new one overwrites, a second rod in the same inventory keeps its own', () => {
  blocks.clear();
  blocks.set('1,2,3', 'minecraft:acacia_pressure_plate');
  blocks.set('5,2,5', 'minecraft:heavy_weighted_pressure_plate');
  const p = fakePlayer('two_rods', 0);
  p.items[0] = B.makePearlRod();
  p.items[1] = B.makePearlRod();
  cast(p, { x: 1.5, y: 2, z: 3.5 });
  run(2);
  p.selectedSlotIndex = 1;
  cast(p, { x: 5.5, y: 2, z: 5.5 });
  run(2);
  assert.equal(bindingIn(p, 0).type, 'minecraft:acacia_pressure_plate');
  assert.deepEqual(bindingIn(p, 0).pos, { x: 1, y: 2, z: 3 });
  assert.equal(bindingIn(p, 1).type, 'minecraft:heavy_weighted_pressure_plate');
  p.selectedSlotIndex = 0;
  cast(p, { x: 5.5, y: 2, z: 5.5 });
  run(2);
  assert.deepEqual(bindingIn(p, 0).pos, { x: 5, y: 2, z: 5 }, 'overwritten');
  assert.equal(bindingIn(p, 0).type, 'minecraft:heavy_weighted_pressure_plate');
  assert.deepEqual(p.items[0].getLore(), ['Pearl Rod', 'bound: overworld 5 2 5']);
  assert.equal(bindingIn(p, 1).type, 'minecraft:heavy_weighted_pressure_plate');
  assert.notEqual(p.items[0].getDynamicProperty('andrew:pearl_rod'), p.items[1].getDynamicProperty('andrew:pearl_rod'));
});

test('the rod is found by its id when it has moved slots between the cast and the hit', () => {
  blocks.clear();
  blocks.set('2,2,2', 'minecraft:warped_pressure_plate');
  const p = fakePlayer('mover', 0);
  p.items[0] = new B.ItemStack('minecraft:stick');
  p.items[4] = B.makePearlRod();
  p.selectedSlotIndex = 4;
  const h = cast(p, { x: 2.5, y: 2, z: 2.5 });
  p.items[7] = p.items[4];
  p.items[4] = undefined;
  run(2);
  assert.equal(h.isValid, false);
  assert.equal(bindingIn(p, 7).type, 'minecraft:warped_pressure_plate');
});
