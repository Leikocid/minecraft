// The plate generation (spec v3 §7–§8; L0-xcx34, L0-pear-ru03, L0-pear-ent2), off the engine: the verdict a bound
// plate gets, the cells each observed path replaces, the store of generations and its pruning, and
// src/pearl/generation.ts with src/pearl/bind.ts against a stand-in @minecraft/server.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asModule = (text) => import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));

const rulesBundle = await build({
  stdin: {
    contents: "export * from './src/pearl/generation-rules.ts'; export { generationKey, readBinding, bindingEntries } from './src/pearl/bind-rules.ts';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const G = await asModule(rulesBundle.outputFiles[0].text);

const OW = 'minecraft:overworld';
const STONE = 'minecraft:stone_pressure_plate';
const OAK = 'minecraft:wooden_pressure_plate';

/** A world's dynamic properties, as the engine keeps them: set(undefined) deletes. */
function mapStore() {
  const m = new Map();
  return {
    m,
    get: (k) => m.get(k),
    set: (k, v) => (v === undefined ? m.delete(k) : m.set(k, v)),
    ids: () => [...m.keys()],
  };
}

const cell = (x, y = 64, z = 0) => ({ x, y, z });
const watchedCount = (s) => G.watchedCells(s).length;
const keysOf = (s, prefix) => [...s.m.keys()].filter((k) => k.startsWith(prefix)).length;

// ------------------------------------------------------------------ the verdict (L0-pear-ru03)

test('generation-rules imports nothing from the engine', () => {
  assert.doesNotMatch(rulesBundle.outputFiles[0].text, /@minecraft\//);
});

test('the same type and the same generation is the same plate; anything else refuses the trip', () => {
  const b = { type: STONE, gen: 7 };
  assert.equal(G.plateVerdict(b, STONE, 7), 'same');
  assert.equal(G.plateVerdict(b, OAK, 7), 'other-type', 'a different plate type, generation untouched (/setblock)');
  assert.equal(G.plateVerdict(b, 'minecraft:air', 7), 'missing');
  assert.equal(G.plateVerdict(b, 'minecraft:stone', 7), 'missing');
  assert.equal(G.plateVerdict(b, STONE, 0), 'replaced', 'the generation ended (observed path, or pruned)');
  assert.equal(G.plateVerdict(b, STONE, 9), 'replaced', 'a later generation of the same cell');
  assert.equal(G.plateVerdict(b, undefined, 7), 'unloaded');
  assert.deepEqual(['same', 'missing', 'other-type', 'replaced', 'unloaded'].map(G.honours), [true, false, false, false, false]);
});

test('a missing plate wins over a stale generation, a different type over a stale generation', () => {
  assert.equal(G.plateVerdict({ type: STONE, gen: 3 }, 'minecraft:air', 0), 'missing');
  assert.equal(G.plateVerdict({ type: STONE, gen: 3 }, OAK, 0), 'other-type');
});

// ------------------------------------------------------------------ which cells each observed path replaces

test('a broken or exploded block replaces its own cell and the plate standing on it', () => {
  assert.deepEqual(G.cellsBroken({ x: 3, y: 1, z: -4 }), [{ x: 3, y: 1, z: -4 }, { x: 3, y: 2, z: -4 }]);
});

test('the piston neighbourhood covers the arm cell, every destination, and a plate on any moved block', () => {
  const has = (cells, c) => cells.some((d) => d.x === c.x && d.y === c.y && d.z === c.z);
  const piston = { x: 0, y: 0, z: 0 };
  const pushed = [{ x: 0, y: 1, z: 0 }, { x: 0, y: 2, z: 0 }];
  const cells = G.pistonCells(piston, pushed);
  assert.ok(has(cells, { x: 0, y: 3, z: 0 }), 'the destination of the front block');
  assert.ok(has(cells, { x: 0, y: 4, z: 0 }), 'a plate on the front block');
  assert.ok(has(cells, { x: 1, y: 0, z: 0 }) && has(cells, { x: 0, y: 0, z: -1 }), 'every arm direction of a bare piston');
  for (const c of [{ x: 1, y: 1, z: 0 }, { x: 0, y: 2, z: 1 }]) assert.ok(has(cells, c), `a sideways push from ${JSON.stringify(c)}`);
  assert.equal(G.pistonCells(piston, []).length, 3 * 4 * 3, 'a piston that moves nothing: its 3×3×3 and one layer up');
});

// ------------------------------------------------------------------ the store: claim, release, bump (L0-pear-ent2)

test('the first binding to a cell creates its generation with a fresh stamp; a second rod there records the same', () => {
  const s = mapStore();
  assert.equal(G.generationOf(s, OW, cell(1)), 0, 'an unwatched cell reads 0');
  const a = G.claim(s, OW, cell(1), 'rodA', 'p1');
  assert.equal(a.created, true);
  assert.ok(a.gen >= 1);
  assert.equal(s.get('andrew:pg:overworld:1:64:0'), a.gen, 'the key bind.ts and the teleport read');
  const b = G.claim(s, OW, cell(1), 'rodB', 'p2');
  assert.equal(b.created, false);
  assert.equal(b.gen, a.gen);
  const c = G.claim(s, OW, cell(2), 'rodC', 'p1');
  assert.notEqual(c.gen, a.gen);
  assert.equal(watchedCount(s), 2);
  assert.deepEqual(Object.keys(G.watchedCells(s).find((w) => w.pos.x === 1).record.rods).sort(), ['rodA', 'rodB']);
});

test('an observed replacement ends the generation: the old binding never matches again, even after a new binding there', () => {
  const s = mapStore();
  const old = G.claim(s, OW, cell(1), 'rodA', 'p1').gen;
  assert.equal(G.bump(s, OW, cell(1)), true);
  assert.equal(G.generationOf(s, OW, cell(1)), 0);
  assert.equal(G.plateVerdict({ type: STONE, gen: old }, STONE, G.generationOf(s, OW, cell(1))), 'replaced');
  const fresh = G.claim(s, OW, cell(1), 'rodB', 'p1').gen;
  assert.ok(fresh > old, 'stamps only grow');
  assert.equal(G.plateVerdict({ type: STONE, gen: old }, STONE, G.generationOf(s, OW, cell(1))), 'replaced', 'not revived by the new generation');
  assert.equal(G.plateVerdict({ type: STONE, gen: fresh }, STONE, G.generationOf(s, OW, cell(1))), 'same');
  assert.equal(G.bump(s, OW, cell(9)), false, 'an unwatched cell is left alone and nothing is written');
  assert.equal(keysOf(s, 'andrew:pg:'), 1);
});

test('the generation is per dimension: the same coordinates in the Nether are another cell', () => {
  const s = mapStore();
  const ow = G.claim(s, OW, cell(1), 'rodA', 'p1').gen;
  const ne = G.claim(s, 'minecraft:nether', cell(1), 'rodB', 'p1').gen;
  G.bump(s, 'minecraft:nether', cell(1));
  assert.equal(G.generationOf(s, OW, cell(1)), ow);
  assert.equal(G.generationOf(s, 'minecraft:nether', cell(1)), 0);
  assert.notEqual(ow, ne);
});

test('pruning: the last rod released takes the cell with it; earlier releases keep it', () => {
  const s = mapStore();
  const gen = G.claim(s, OW, cell(1), 'rodA', 'p1').gen;
  G.claim(s, OW, cell(1), 'rodB', 'p2');
  assert.equal(G.release(s, OW, cell(1), gen, 'rodA'), 'released');
  assert.equal(G.generationOf(s, OW, cell(1)), gen, 'rodB still holds it');
  assert.equal(G.release(s, OW, cell(1), gen, 'rodA'), 'none', 'twice is nothing');
  assert.equal(G.release(s, OW, cell(1), gen, 'rodB'), 'pruned');
  assert.equal(s.m.size, 1, `only the sequence is left: ${[...s.m.keys()]}`);
  assert.ok(s.m.has('andrew:pg_seq'));
});

test('a release naming another generation of the cell is nothing: that rod was already out', () => {
  const s = mapStore();
  const old = G.claim(s, OW, cell(1), 'rodA', 'p1').gen;
  G.bump(s, OW, cell(1));
  G.claim(s, OW, cell(1), 'rodB', 'p1');
  assert.equal(G.release(s, OW, cell(1), old, 'rodA'), 'none');
  assert.equal(G.release(s, OW, cell(1), old, 'rodB'), 'none', 'rodB is in the new generation, not the old one');
  assert.equal(watchedCount(s), 1);
});

test('an overwrite moves the rod: claiming a new cell with the previous binding releases the old one', () => {
  const s = mapStore();
  const g1 = G.claim(s, OW, cell(1), 'rodA', 'p1').gen;
  G.claim(s, OW, cell(2), 'rodA', 'p1', { dim: OW, pos: cell(1), gen: g1 });
  assert.equal(G.generationOf(s, OW, cell(1)), 0, 'nobody is bound to cell 1 any more');
  assert.equal(watchedCount(s), 1);
  const g2 = G.generationOf(s, OW, cell(2));
  G.claim(s, OW, cell(2), 'rodA', 'p1', { dim: OW, pos: cell(2), gen: g2 });
  assert.equal(G.generationOf(s, OW, cell(2)), g2, 're-binding the same plate keeps its generation');
});

test('the binder dies: their rods leave every cell; cells still held by someone else stay', () => {
  const s = mapStore();
  G.claim(s, OW, cell(1), 'rodA', 'dead');
  G.claim(s, OW, cell(2), 'rodB', 'dead');
  G.claim(s, OW, cell(2), 'rodC', 'alive');
  G.claim(s, OW, cell(3), 'rodD', 'dead');
  G.claim(s, OW, cell(3), 'rodE', 'dead');
  assert.deepEqual(G.forgetOwner(s, 'dead'), { released: 4, pruned: 2 });
  assert.deepEqual(G.watchedCells(s).map((w) => [w.pos.x, Object.keys(w.record.rods)]), [[2, ['rodC']]]);
  assert.deepEqual(G.forgetOwner(s, 'nobody'), { released: 0, pruned: 0 });
});

// ------------------------------------------------------------------ the bounds

test('more rods on one cell than tracked: the cell is pinned, and no release prunes it', () => {
  const s = mapStore();
  let gen = 0;
  for (let i = 0; i < G.MAX_RODS_PER_CELL; i++) gen = G.claim(s, OW, cell(1), `rod${i}`, 'p').gen;
  assert.equal(G.watchedCells(s)[0].record.pinned, false);
  G.claim(s, OW, cell(1), 'one-too-many', 'p');
  const w = G.watchedCells(s)[0];
  assert.equal(w.record.pinned, true);
  assert.deepEqual(w.record.rods, {}, 'nothing per rod is kept once pinned');
  for (let i = 0; i < G.MAX_RODS_PER_CELL; i++) G.release(s, OW, cell(1), gen, `rod${i}`);
  G.forgetOwner(s, 'p');
  assert.equal(G.generationOf(s, OW, cell(1)), gen, 'a pinned cell stays until it is replaced or evicted');
  assert.equal(G.bump(s, OW, cell(1)), true);
});

test('past the cell limit the cell bound longest ago is evicted; binding again refreshes a cell', () => {
  const s = mapStore();
  for (let i = 0; i < G.MAX_CELLS; i++) G.claim(s, OW, cell(i), `rod${i}`, 'p');
  assert.equal(watchedCount(s), G.MAX_CELLS);
  const refreshed = G.generationOf(s, OW, cell(0));
  G.claim(s, OW, cell(0), 'rod0b', 'p');
  const r = G.claim(s, OW, cell(G.MAX_CELLS), 'new', 'p');
  assert.deepEqual(r.evicted, [{ dim: OW, pos: cell(1) }], 'cell 1 was bound longest ago; cell 0 was bound again');
  assert.equal(watchedCount(s), G.MAX_CELLS);
  assert.equal(G.generationOf(s, OW, cell(0)), refreshed);
  assert.equal(G.generationOf(s, OW, cell(1)), 0, 'its bindings now read replaced: eviction can only refuse a trip');
});

test('a generation with no record is kept pinned and evicted first; a record with no generation is dropped', () => {
  const s = mapStore();
  s.set(G.generationKey(OW, cell(5)), 4);
  s.set('andrew:pgw:overworld:6:64:0', JSON.stringify({ rods: { x: ['p', 1] }, last: 1, pinned: false }));
  s.set('andrew:pgw:overworld:7:64:0', 'not json');
  assert.equal(G.claim(s, OW, cell(5), 'rodA', 'p').gen, 4, 'the generation it holds is the one recorded');
  assert.equal(G.watchedCells(s)[0].record.pinned, true);
  G.claim(s, OW, cell(8), 'rodB', 'p');
  assert.equal(s.m.has('andrew:pgw:overworld:6:64:0'), false, 'the orphan record is gone');
  assert.equal(watchedCount(s), 2);
});

test('the store does not grow without bound: 20 000 random binds, overwrites, clears, deaths, burns and breaks', () => {
  const s = mapStore();
  let seed = 12345;
  const rnd = (n) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };
  const key = (pos, gen) => `${pos.x}:${pos.y}:${pos.z}@${gen}`;
  /** rod → its binding as the rod carries it: what release and claim are told. */
  const rods = new Map();
  /** Bindings of rods destroyed without anyone seeing it (lava, despawn): they are never released. */
  const burnt = new Map();
  /** Bindings whose generation an observed path or the cap ended: they must never match again. */
  const ended = [];
  const players = ['a', 'b', 'c', 'd'];
  let maxKeys = 0;
  for (let step = 0; step < 20000; step++) {
    const op = rnd(100);
    const rodId = `rod${rnd(300)}`;
    if (op < 55) {
      const at = cell(rnd(2000), 64, rnd(3));
      const owner = players[rnd(players.length)];
      const r = G.claim(s, OW, at, rodId, owner, rods.get(rodId));
      for (const e of r.evicted) for (const b of [...rods.values(), ...burnt.values()]) if (G.sameCell(b.pos, e.pos)) ended.push({ ...b });
      rods.set(rodId, { dim: OW, pos: at, gen: r.gen, owner });
    } else if (op < 85) {
      const b = rods.get(rodId);
      if (b !== undefined) G.release(s, OW, b.pos, b.gen, rodId);
      rods.delete(rodId);
    } else if (op < 90) {
      const who = players[rnd(players.length)];
      G.forgetOwner(s, who);
      for (const [id, b] of rods) if (b.owner === who) rods.delete(id);
      for (const [k, b] of burnt) if (b.owner === who) burnt.delete(k);
    } else if (op < 95) {
      const b = rods.get(rodId);
      if (b !== undefined) burnt.set(`${rodId}/${step}`, { ...b, rodId });
      rods.delete(rodId);
    } else {
      const watchedNow = G.watchedCells(s);
      const at = watchedNow.length > 0 && rnd(2) === 0 ? watchedNow[rnd(watchedNow.length)].pos : cell(rnd(2000), 64, rnd(3));
      const gen = G.generationOf(s, OW, at);
      if (G.bump(s, OW, at)) ended.push({ pos: at, gen });
    }
    maxKeys = Math.max(maxKeys, s.m.size);
  }
  const watched = G.watchedCells(s);
  assert.ok(watched.length <= G.MAX_CELLS, `${watched.length} cells`);
  assert.ok(maxKeys <= 2 * G.MAX_CELLS + 1, `peak ${maxKeys} keys`);
  // Pruned exactly when nobody is bound: every cell still watched is held by a live binding or a burnt rod's.
  const holders = new Set([...rods.values(), ...burnt.values()].map((b) => key(b.pos, b.gen)));
  const idle = watched.filter((w) => !w.record.pinned && !holders.has(key(w.pos, w.gen)));
  assert.deepEqual(idle, [], 'cells nobody is bound to');
  // And never a wrong match: a generation once ended is not the cell's generation again.
  for (const e of ended) assert.notEqual(G.generationOf(s, OW, e.pos), e.gen, `ended generation ${key(e.pos, e.gen)} matches again`);
  assert.ok(ended.length > 100, `${ended.length} ended generations exercised`);
});

test('with every binding released the store is empty but for the sequence', () => {
  const s = mapStore();
  const held = [];
  for (let i = 0; i < 300; i++) {
    const at = cell(i % 40);
    held.push([at, G.claim(s, OW, at, `rod${i}`, 'p').gen, `rod${i}`]);
  }
  assert.equal(watchedCount(s), 40);
  for (const [at, gen, id] of held) G.release(s, OW, at, gen, id);
  assert.deepEqual([...s.m.keys()], ['andrew:pg_seq']);
});

// ------------------------------------------------------------------ generation.ts and bind.ts on a stand-in engine

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = (globalThis.__gen = { intervals: [], timeouts: [], on: {}, worldDp: new Map(), dims: new Map() });
        const signal = (name) => ({ subscribe(cb, opts) { H.on[name] = cb; H.on[name + ':opts'] = opts; return cb; } });
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
          setDynamicProperty(k, v) { if (this.maxAmount !== 1) throw new Error('stackable'); if (v === undefined) this.dp.delete(k); else this.dp.set(k, v); }
          getDynamicProperty(k) { if (this.maxAmount !== 1) throw new Error('stackable'); return this.dp.get(k); }
          getComponent(id) { return id === 'minecraft:durability' ? this.durability : undefined; }
        }
        export const world = {
          getAbsoluteTime: () => 99,
          getAllPlayers: () => [],
          getDimension: (id) => H.dims.get(id),
          getDynamicProperty: (k) => H.worldDp.get(k),
          setDynamicProperty: (k, v) => (v === undefined ? H.worldDp.delete(k) : H.worldDp.set(k, v)),
          getDynamicPropertyIds: () => [...H.worldDp.keys()],
          afterEvents: {
            playerInventoryItemChange: signal('inventory'),
            itemUse: signal('itemUse'),
            entitySpawn: signal('spawn'),
            projectileHitEntity: signal('hitEntity'),
            playerBreakBlock: signal('break'),
            playerPlaceBlock: signal('place'),
            blockExplode: signal('explode'),
            pistonActivate: signal('piston'),
            entityDie: signal('die'),
          },
        };
        export const system = {
          run() {},
          runTimeout(cb, t) { H.timeouts.push([cb, t]); },
          runInterval(cb, t) { H.intervals.push([cb, t]); },
        };
      `,
    }));
  },
};

const engineBundle = await build({
  stdin: {
    contents: [
      "export * from './src/pearl/generation.ts';",
      "export { registerPearlBind, bindingOf, plateGeneration } from './src/pearl/bind.ts';",
      "export { makePearlRod } from './src/pearl/item.ts';",
      "export { ItemStack, Player } from '@minecraft/server';",
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
const E = await asModule(engineBundle.outputFiles[0].text);
const H = globalThis.__gen;
E.registerPearlGeneration();
E.registerPearlBind();
const [tick] = H.intervals[0];

/** Blocks of the stand-in overworld, by "x,y,z". */
const blocks = new Map();
const overworld = { id: OW, getBlock: (c) => ({ typeId: blocks.get(`${c.x},${c.y},${c.z}`) ?? 'minecraft:air' }) };
H.dims.set(OW, overworld);
const at = (c) => ({ location: c });

function fakePlayer(name) {
  const items = new Array(36).fill(undefined);
  const container = { size: 36, getItem: (i) => items[i]?.clone(), setItem: (i, s) => { items[i] = s?.clone(); } };
  return Object.assign(new E.Player(), {
    name, id: `id-${name}`, isValid: true, selectedSlotIndex: 0, items,
    getComponent: (id) => (id === 'minecraft:inventory' ? { container } : undefined),
    getDynamicProperty: () => undefined,
    onScreenDisplay: { setActionBar() {} },
  });
}

let hookIds = 0;
/** A cast that comes to rest in `c` and binds on the second check. */
function bindAt(p, c) {
  const h = {
    typeId: 'minecraft:fishing_hook', id: `hook-${++hookIds}`, isValid: true, location: { x: c.x + 0.5, y: c.y, z: c.z + 0.5 },
    isOnGround: true, dimension: overworld, getVelocity: () => ({ x: 0, y: 0, z: 0 }),
    getComponent: (id) => (id === 'minecraft:projectile' ? { owner: p } : undefined),
    remove() { this.isValid = false; },
  };
  H.on.spawn({ entity: h });
  tick();
  tick();
  assert.equal(h.isValid, false, 'the cast bound');
  return E.bindingOf(p.items[p.selectedSlotIndex]);
}

const reset = () => {
  blocks.clear();
  H.worldDp.clear();
  H.timeouts.length = 0;
};

test('the binding claims its cell: a new cell gets a fresh generation, the rod records it, a bump ends it', () => {
  reset();
  blocks.set('3,2,6', STONE);
  const p = fakePlayer('binder');
  p.items[0] = E.makePearlRod();
  const b = bindAt(p, { x: 3, y: 2, z: 6 });
  assert.ok(b.gen >= 1);
  assert.equal(E.plateGeneration(OW, b.pos), b.gen, 'the reader the teleport uses agrees');
  assert.equal(E.plateCheck(b), 'same');
  assert.equal(E.watchedNow().length, 1);
  H.on.break({ dimension: overworld, block: at({ x: 3, y: 2, z: 6 }) });
  assert.equal(E.plateCheck(b), 'replaced', 'the plate itself was broken; it still reads as a stone plate here');
});

test('the observed paths: a break or an explosion of the support, a player placing into the cell', () => {
  for (const [label, fire] of [
    ['break support', () => H.on.break({ dimension: overworld, block: at({ x: 3, y: 1, z: 6 }) })],
    ['explode plate', () => H.on.explode({ dimension: overworld, block: at({ x: 3, y: 2, z: 6 }) })],
    ['explode support', () => H.on.explode({ dimension: overworld, block: at({ x: 3, y: 1, z: 6 }) })],
    ['place into the cell', () => H.on.place({ dimension: overworld, block: at({ x: 3, y: 2, z: 6 }) })],
  ]) {
    reset();
    blocks.set('3,2,6', OAK);
    const p = fakePlayer(label.replace(/ /g, '_'));
    p.items[0] = E.makePearlRod();
    const b = bindAt(p, { x: 3, y: 2, z: 6 });
    for (const miss of [{ x: 3, y: 3, z: 6 }, { x: 4, y: 1, z: 6 }, { x: 3, y: 0, z: 6 }]) H.on.break({ dimension: overworld, block: at(miss) });
    H.on.place({ dimension: overworld, block: at({ x: 3, y: 3, z: 6 }) });
    assert.equal(E.plateCheck(b), 'same', `${label}: blocks around it are not the plate`);
    fire();
    assert.equal(E.plateCheck(b), 'replaced', label);
  }
});

test('a piston: the watched cell is bumped only when its plate is gone once the move settles', () => {
  reset();
  blocks.set('3,2,6', STONE);
  const p = fakePlayer('piston');
  p.items[0] = E.makePearlRod();
  const b = bindAt(p, { x: 3, y: 2, z: 6 });
  const fire = (pistonAt, attached) =>
    H.on.piston({ dimension: overworld, block: at(pistonAt), isExpanding: true, piston: { getAttachedBlocksLocations: () => attached } });
  fire({ x: 20, y: 2, z: 6 }, [{ x: 19, y: 2, z: 6 }]);
  assert.equal(H.timeouts.length, 0, 'a piston far from every watched cell schedules nothing');
  fire({ x: 2, y: 2, z: 6 }, []);
  assert.equal(H.timeouts.length, 1);
  assert.equal(H.timeouts[0][1], E.PISTON_SETTLE_TICKS);
  H.timeouts.shift()[0]();
  assert.equal(E.plateCheck(b), 'same', 'the plate is still there');
  fire({ x: 3, y: 0, z: 6 }, [{ x: 3, y: 1, z: 6 }]);
  blocks.set('3,2,6', 'minecraft:stone');
  H.timeouts.shift()[0]();
  blocks.set('3,2,6', STONE);
  assert.equal(E.plateCheck(b), 'replaced', 'pushed from below: the plate was destroyed, then the same type put back');
});

test('the rod`s binding cleared in its slot releases the cell; a moved or re-written rod does not', () => {
  reset();
  blocks.set('3,2,6', STONE);
  const p = fakePlayer('clearer');
  p.items[0] = E.makePearlRod();
  const b = bindAt(p, { x: 3, y: 2, z: 6 });
  const bound = p.items[0].clone();
  const change = (before, after) => H.on.inventory({ player: p, slot: 0, beforeItemStack: before, itemStack: after });
  change(bound, undefined);
  change(bound, new E.ItemStack('minecraft:stick'));
  change(bound, E.makePearlRod());
  const worn = bound.clone();
  worn.durability.damage = 2;
  change(bound, worn);
  assert.equal(E.plateGeneration(OW, b.pos), b.gen, 'moved away, another item, another rod, a durability write: all keep it');
  const cleared = bound.clone();
  for (const k of ['andrew:pr_dim', 'andrew:pr_pos', 'andrew:pr_type', 'andrew:pr_owner', 'andrew:pr_epoch', 'andrew:pr_gen']) cleared.setDynamicProperty(k, undefined);
  change(bound, cleared);
  assert.equal(E.plateGeneration(OW, b.pos), 0, 'the only rod there is unbound now: the cell is pruned');
  assert.equal(E.watchedNow().length, 0);
});

test('an overwrite through the binding moves the rod to its new cell and prunes the old one', () => {
  reset();
  blocks.set('1,2,3', STONE);
  blocks.set('5,2,5', OAK);
  const p = fakePlayer('mover');
  p.items[0] = E.makePearlRod();
  const first = bindAt(p, { x: 1, y: 2, z: 3 });
  const second = bindAt(p, { x: 5, y: 2, z: 5 });
  assert.equal(E.plateGeneration(OW, first.pos), 0);
  assert.equal(E.plateGeneration(OW, second.pos), second.gen);
  assert.deepEqual(E.watchedNow().map((w) => w.pos), [{ x: 5, y: 2, z: 5 }]);
});

test('the binder`s death releases their rods: subscribed for players only', () => {
  reset();
  blocks.set('1,2,3', STONE);
  const a = fakePlayer('dies');
  const b = fakePlayer('lives');
  a.items[0] = E.makePearlRod();
  b.items[0] = E.makePearlRod();
  const ba = bindAt(a, { x: 1, y: 2, z: 3 });
  bindAt(b, { x: 1, y: 2, z: 3 });
  assert.deepEqual(H.on['die:opts'], { entityTypes: ['minecraft:player'] });
  H.on.die({ deadEntity: a });
  assert.equal(E.plateGeneration(OW, ba.pos), ba.gen, 'the other binder still holds the cell');
  H.on.die({ deadEntity: b });
  assert.equal(E.plateGeneration(OW, ba.pos), 0);
  H.on.die({ deadEntity: undefined });
});

test('arming twice arms once: a second binding interval would confirm a hit within one tick', () => {
  const intervals = H.intervals.length;
  const handlers = { ...H.on };
  E.registerPearlBind();
  E.registerPearlGeneration();
  assert.equal(H.intervals.length, intervals);
  assert.deepEqual(Object.keys(H.on), Object.keys(handlers));
  for (const k of Object.keys(handlers)) assert.equal(H.on[k], handlers[k], k);
});
