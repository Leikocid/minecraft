// The Mini Bastion body (src/structures/bodies/bastion.ts) over fakes: the 5 %
// Nether roll and nothing elsewhere, the netherFloor site, 3 + 7 chests on the
// two vanilla bastion tables, the 2–4 treasure gold, the one-time garrison of
// 7–10 piglins and 2 brutes with no hoglin and no spawner, and a restart that
// neither re-spawns nor refills.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { cellIndex, parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';

const projectRoot = join(import.meta.dirname, '..');

const bundle = await build({
  stdin: {
    contents: `
      export * from './src/structures/bodies/bastion.ts';
      export * from './src/structures/bodies.ts';
      export * from './src/structures/config.ts';
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/roll.ts';
      export * from './src/structures/place.ts';
      export * from './src/structures/runtime.ts';
      export { toWorld } from './src/structures/rotate.ts';
      export { BASTION_TREASURE, BASTION_OTHER, CUSTOM_TABLE } from './src/structures/loot.ts';
      export { default as bastionTemplate, BASTION_ID, BASTION_SIZE, BRUTE_SLOTS, CHESTS as BASTION_CHESTS, TREASURE, TREASURE_GOLD } from './src/structures/templates/bastion.ts';`,
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['@minecraft/server'],
  write: false,
});
const m = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  BASTION_BODY, garrison, piglinCount, goldKept, guardTag, roleTag, PIGLIN, BRUTE, PIGLIN_MIN, PIGLIN_MAX, PIGLIN_POINTS,
  BODIES, naturalDefs, CHANCES, ROLL_DEFS, MemoryStore, SALT_KEY, rollHit, StrfRuntime, GUARDS_SPAWNED, CHESTS_FILLED,
  BASTION_TREASURE, BASTION_OTHER, CUSTOM_TABLE, toWorld, bastionTemplate, BASTION_ID, BASTION_SIZE, BRUTE_SLOTS, BASTION_CHESTS, TREASURE, TREASURE_GOLD,
} = m;

const AIR = 'minecraft:air';
const bastionDef = () => naturalDefs(BODIES).find((d) => d.id === 'bastion');

/** The shipped .mcstructure, as the engine reads it. */
const shipped = (() => {
  const out = mkdtempSync(join(tmpdir(), 'andrew-bastion-body-'));
  try {
    buildStructures({ to: out });
    return parseMcstructure(readFileSync(join(out, 'bastion.mcstructure')));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
})();
const shippedAt = (x, y, z) => {
  const i = shipped.primary[cellIndex(shipped.size, x, y, z)];
  return i === -1 ? 'minecraft:structure_void' : shipped.palette[i].name;
};

/**
 * A Nether of netherrack up to `floor(x, z)` and air over it, or a lava sea
 * (lava up to 31, air above) where `sea(x, z)`; explicit blocks override.
 */
class FakeNether {
  constructor({ floor = () => 45, sea = () => false } = {}) {
    Object.assign(this, { floor, sea, minY: 0, maxY: 128 });
    this.blocks = new Map();
    this.writes = [];
  }
  type(x, y, z) {
    const t = this.blocks.get(`${x},${y},${z}`);
    if (t !== undefined) return t;
    if (y <= 0 || y >= 127) return 'minecraft:bedrock';
    if (this.sea(x, z)) return y <= 31 ? 'minecraft:lava' : AIR;
    return y <= this.floor(x, z) ? 'minecraft:netherrack' : AIR;
  }
  view() {
    return {
      minY: this.minY,
      maxY: this.maxY,
      isLoaded: () => true,
      topmost: (x, z) => {
        for (let y = 126; y >= 0; y--) if (this.type(x, y, z) !== AIR) return { y, typeId: this.type(x, y, z) };
        return undefined;
      },
      typeAt: (x, y, z) => this.type(x, y, z),
      contains: (lo, hi, types) => {
        for (const [k, t] of this.blocks) {
          const [x, y, z] = k.split(',').map(Number);
          if (x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2] && types.includes(t)) return true;
        }
        return false;
      },
    };
  }
  edit() {
    return {
      topmost: (x, z) => this.view().topmost(x, z),
      typeAt: (x, y, z) => this.type(x, y, z),
      set: (pos, typeId) => {
        this.writes.push(`set ${pos.join(',')} ${typeId}`);
        this.blocks.set(pos.join(','), typeId);
      },
    };
  }
}

/** Template-local → world, as the engine's place and the Placer's contexts map it. */
const worldOf = (origin, p, rot) => toWorld(origin, [...p], rot % 2 === 0 ? [...BASTION_SIZE] : [BASTION_SIZE[2], BASTION_SIZE[1], BASTION_SIZE[0]], rot);

/** The engine fake: place writes the template's four gold slots, like the real template does. */
function runtime(w, { store = new MemoryStore(), events = [], salt = 'bast-node' } = {}) {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, salt);
  let rt;
  const engine = {
    view: (d) => (d === 'n' ? w.view() : undefined),
    placeWorld: (d) => (d !== 'n' ? undefined : {
      hasTemplate: () => true,
      isLoaded: () => true,
      place: (id, origin, rot) => {
        const rec = rt.registry.allInstances().find((i) => i.origin.join() === origin.join());
        events.push(`place ${id} ${origin.join(',')} rot ${rot} record=${rec?.state}`);
        for (const g of TREASURE_GOLD) w.blocks.set(worldOf(origin, g, rot).join(','), 'minecraft:gold_block');
      },
      fill: () => events.push('fill'),
      edit: w.edit(),
    }),
    hooks: () => ({
      fillChest: (ctx) => events.push({ chest: ctx.index, table: ctx.table, pos: ctx.pos }),
      spawnGuard: (ctx) => events.push({ guard: ctx.index, entity: ctx.entity, tags: ctx.tags, name: ctx.name, pos: ctx.pos }),
    }),
  };
  rt = new StrfRuntime(store, engine);
  return rt;
}

// ------------------------------------------------------------------ the body

test('the Bastion is a real body: its template, 3 treasure + 7 other chests on the vanilla bastion tables, no clear', () => {
  assert.equal(BODIES.bastion, BASTION_BODY);
  assert.equal(BASTION_BODY.standIn, false);
  assert.equal(BASTION_BODY.templateId, BASTION_ID);
  assert.deepEqual(BASTION_BODY.size, [...BASTION_SIZE]);
  assert.equal(BASTION_BODY.chests.length, 10);
  assert.deepEqual(BASTION_BODY.chests.map((c) => c.local), BASTION_CHESTS.map((c) => [...c.at]));
  const tables = BASTION_BODY.chests.map((c) => c.table);
  assert.deepEqual(tables, [...Array(3).fill(BASTION_TREASURE), ...Array(7).fill(BASTION_OTHER)]);
  assert.ok(!tables.includes(CUSTOM_TABLE), 'the custom weighted table reached the Bastion');
  BASTION_BODY.chests.forEach((c, i) => {
    const zone = BASTION_CHESTS[i].zone;
    assert.equal(c.table, zone === 'treasure' ? BASTION_TREASURE : BASTION_OTHER, `chest ${i} (${zone})`);
    // Treasure chests stand on the island.
    if (zone === 'treasure') assert.ok(c.local[0] >= TREASURE.x0 && c.local[0] <= TREASURE.x1 && c.local[2] >= TREASURE.z0 && c.local[2] <= TREASURE.z1);
  });
  assert.equal(BASTION_BODY.clear, undefined, 'the Nether terrain is never cleared for a bastion');
  assert.equal(BASTION_BODY.linked, undefined);
  assert.equal(BASTION_BODY.spot, undefined);
  const def = bastionDef();
  assert.equal(def.chance, CHANCES.bastion);
  assert.equal(def.chance, 0.05);
  assert.equal(def.dim, 'n');
  assert.deepEqual(def.size, [...BASTION_SIZE]);
});

// ------------------------------------------------------------------ AC6: no spawner

test('AC6: the shipped Bastion template holds no mob_spawner, and the garrison names only piglins and brutes', () => {
  const spawners = [];
  const counts = new Map();
  const [SX, SY, SZ] = shipped.size;
  for (let x = 0; x < SX; x++) for (let y = 0; y < SY; y++) for (let z = 0; z < SZ; z++) {
    const n = shippedAt(x, y, z);
    counts.set(n, (counts.get(n) ?? 0) + 1);
    if (/spawner/.test(n)) spawners.push(`${x},${y},${z} ${n}`);
  }
  console.log(`# bastion template: ${SX}×${SY}×${SZ}, spawner cells ${spawners.length}, chests ${counts.get('minecraft:chest')}, palette ${shipped.palette.length}`);
  assert.deepEqual(spawners, []);
  assert.ok(!shipped.palette.some((b) => /spawner/.test(b.name)), 'a spawner in the palette');
  assert.ok(!Object.values(bastionTemplate().blocks).some((b) => /spawner/.test(b.name)), 'a spawner in the template source');
  const entities = new Set();
  for (let i = 0; i < 500; i++) for (const g of garrison(`bastion:n:${i}:${-i}`)) entities.add(g.entity);
  assert.deepEqual([...entities].sort(), [PIGLIN, BRUTE].sort());
});

// ------------------------------------------------------------------ AC3: the roster

test('AC3: every roster has 7–10 piglins and exactly 2 brutes, one on the treasure island, never a hoglin', () => {
  const seen = new Map();
  for (let i = 0; i < 2000; i++) {
    const id = `bastion:n:${i % 97}:${Math.floor(i / 97)}`;
    const g = garrison(id);
    const piglins = g.filter((x) => x.entity === PIGLIN);
    const brutes = g.filter((x) => x.entity === BRUTE);
    assert.ok(piglins.length >= PIGLIN_MIN && piglins.length <= PIGLIN_MAX, `${id}: ${piglins.length} piglins`);
    assert.equal(piglins.length, piglinCount(id));
    assert.equal(brutes.length, 2);
    assert.ok(!g.some((x) => /hoglin/.test(x.entity)));
    assert.ok(g.every((x) => x.tags.includes(guardTag(id)) && x.name !== undefined), 'untagged or unnamed guard');
    assert.ok(g.every((x) => x.fireproof === true), 'a guard that burns in the moat');
    assert.deepEqual(brutes.map((b) => b.tags.find((t) => t.startsWith('andrew:bastion_role:'))), [roleTag('treasure'), roleTag('other')]);
    // The same id always gives the same roster: a resume continues it, never re-rolls it.
    assert.deepEqual(garrison(id), g);
    seen.set(piglins.length, (seen.get(piglins.length) ?? 0) + 1);
  }
  const t = BRUTE_SLOTS.find((b) => b.slot === 'treasure').at;
  assert.ok(t[0] >= TREASURE.x0 && t[0] <= TREASURE.x1 && t[2] >= TREASURE.z0 && t[2] <= TREASURE.z1 && t[1] === 2, 'the treasure brute is not on the island');
  console.log(`# bastion roster sizes over 2000 ids: ${[...seen].sort((a, b) => a[0] - b[0]).map(([n, c]) => `${n}:${c}`).join(' ')}`);
  assert.deepEqual([...seen.keys()].sort((a, b) => a - b), [7, 8, 9, 10], 'not every count 7..10 occurs');
});

test('AC3: every guard cell is open with head room over a solid block in the shipped template', () => {
  const cells = [...PIGLIN_POINTS, ...BRUTE_SLOTS.map((b) => b.at)];
  assert.equal(new Set(cells.map((c) => c.join(','))).size, cells.length, 'two guards share a cell');
  for (const [x, y, z] of cells) {
    assert.equal(shippedAt(x, y, z), AIR, `${x},${y},${z} feet`);
    assert.equal(shippedAt(x, y + 1, z), AIR, `${x},${y},${z} head`);
    const below = shippedAt(x, y - 1, z);
    assert.ok(below !== AIR && !/lava|structure_void/.test(below), `${x},${y},${z} stands on ${below}`);
  }
});

// ------------------------------------------------------------------ AC8: 5 % in the Nether only

test('AC8: the roll hits close to 5 % of Nether chunks, within 4 sigma, for several salts', () => {
  const def = bastionDef();
  const N = 40000;
  const sigma = Math.sqrt((0.05 * 0.95) / N);
  const lines = [];
  for (const salt of ['a', 'b', 'c', 'bast-stat']) {
    let hits = 0;
    for (let i = 0; i < N; i++) if (rollHit(salt, 'n', (i % 200) - 100, Math.floor(i / 200) - 100, def)) hits++;
    const share = hits / N;
    lines.push(`${salt}: ${hits}/${N} = ${(share * 100).toFixed(2)} %`);
    assert.ok(Math.abs(share - 0.05) <= 4 * sigma, `salt ${salt}: ${share} outside 0.05 ± ${(4 * sigma).toFixed(4)}`);
  }
  console.log(`# bastion roll share (tolerance ±${(4 * sigma * 100).toFixed(2)} pp = 4σ at N=${N}): ${lines.join('; ')}`);
});

test('AC8 + AC1: through discovery, bastions roll only in the Nether; the Overworld gets none and a hand place there names the Nether', () => {
  const w = new FakeNether();
  const rt = runtime(w, { salt: 'bast-dims' });
  let hits = 0;
  let chunks = 0;
  for (let i = 0; i < 40; i++)
    for (let j = 0; j < 40; j++) {
      chunks++;
      for (const r of rt.discovery.evaluateChunk('n', i * 3, j * 3).results) if (r.def === 'bastion' && r.outcome !== 'miss') hits++;
      for (const r of rt.discovery.evaluateChunk('o', i * 3, j * 3).results) assert.notEqual(r.def, 'bastion', 'an Overworld chunk rolled a bastion');
    }
  const recs = rt.registry.allInstances().filter((i) => i.def === 'bastion');
  console.log(`# bastion discovery: ${hits}/${chunks} Nether chunks rolled (${((hits / chunks) * 100).toFixed(2)} %), ${recs.length} records, dims ${[...new Set(recs.map((c) => c.dim))].join(',')}`);
  assert.ok(Math.abs(hits / chunks - 0.05) <= 4 * Math.sqrt((0.05 * 0.95) / chunks));
  assert.ok(recs.length > 0 && recs.every((c) => c.dim === 'n'));
  assert.deepEqual(ROLL_DEFS.filter((d) => d.id === 'bastion').map((d) => d.dim), ['n']);
  assert.deepEqual(rt.placeAt('bastion', 'o', 0, 0, 0), { kind: 'wrong-dimension', need: 'n' });
  assert.equal(rt.registry.allInstances().filter((i) => i.dim === 'o').length, 0);
});

// ------------------------------------------------------------------ AC1: the Nether floor

test('AC1: a netherrack floor is valid; a lava sea, a missing floor and a player build are rejected before any write', () => {
  const cases = [
    { label: 'floor', w: new FakeNether(), expect: 'placed' },
    { label: 'lava-sea', w: new FakeNether({ sea: () => true }), expect: 'rejected', reason: 'lavaOcean' },
    { label: 'no-floor', w: new FakeNether({ floor: () => 20, sea: () => false }), expect: 'rejected', reason: 'floor' },
  ];
  const build = new FakeNether();
  build.blocks.set('200,50,200', 'minecraft:oak_planks');
  cases.push({ label: 'player-build', w: build, expect: 'rejected', reason: 'collision:player' });
  for (const c of cases) {
    const events = [];
    const rt = runtime(c.w, { events });
    const r = rt.placeAt('bastion', 'n', 200, 200, 0);
    assert.equal(r.kind, c.expect, `${c.label}: ${JSON.stringify(r)}`);
    if (c.expect === 'rejected') {
      assert.equal(r.reason, c.reason, c.label);
      assert.equal(events.length, 0, `${c.label} wrote`);
      assert.equal(c.w.writes.length, 0);
    } else {
      assert.equal(r.instance.origin[1], 46, 'the bastion stands one over the floor');
      assert.match(events[0], /record=planned$/);
    }
  }
});

// ------------------------------------------------------------------ AC2 + AC3 + AC4 + AC7: one bastion, start to restart

test('AC2–AC4, AC7: one init fills 10 chests and spawns one roster; re-running the steps and a restart add nothing', () => {
  const w = new FakeNether();
  const store = new MemoryStore();
  const events = [];
  const rt = runtime(w, { store, events });
  const r = rt.placeAt('bastion', 'n', 500, -300, 1);
  assert.equal(r.kind, 'placed');
  const inst = r.instance;
  assert.equal(inst.state, 'done');
  const chests = events.filter((e) => e.chest !== undefined);
  const guards = events.filter((e) => e.guard !== undefined);
  assert.deepEqual(chests.map((c) => c.table), [...Array(3).fill(BASTION_TREASURE), ...Array(7).fill(BASTION_OTHER)]);
  const n = piglinCount(inst.id);
  assert.equal(guards.length, n + 2);
  assert.equal(guards.filter((g) => g.entity === BRUTE).length, 2);
  assert.equal(inst.extras[GUARDS_SPAWNED], n + 2);
  assert.equal(inst.extras[CHESTS_FILLED], 10);
  // The gold trim: 2..4 of the four slots stay.
  const gold = TREASURE_GOLD.filter((g) => w.type(...worldOf(inst.origin, g, inst.rot)) === 'minecraft:gold_block').length;
  assert.equal(gold, goldKept(inst.id).length);
  assert.ok(gold >= 2 && gold <= 4);

  // Re-running: the same place, a resume, a fresh runtime over the same store.
  const before = events.length;
  assert.equal(rt.placeAt('bastion', 'n', 500, -300, 1, { id: inst.id }).kind, 'blocked');
  const rt2 = runtime(w, { store, events });
  assert.equal(rt2.resumeUnfinished(), 0);
  rt2.pumpPlacement(5);
  assert.equal(events.length, before, `the restart added ${events.slice(before).map((e) => JSON.stringify(e)).join(' ')}`);
});

test('gold: every count 2..4 occurs across instances, fixed per id', () => {
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const id = `bastion:n:${i}:7`;
    const k = goldKept(id).length;
    assert.equal(goldKept(id).length, k);
    seen.add(k);
  }
  assert.deepEqual([...seen].sort(), [2, 3, 4]);
});

// ------------------------------------------------------------------ a guard step that cannot run yet

test('a guard step that throws (a Peaceful world) waits at looted and does not starve the placements queued behind it', () => {
  const w = new FakeNether();
  const store = new MemoryStore();
  store.set(SALT_KEY, 'bast-peaceful');
  let peaceful = true;
  const events = [];
  const engine = {
    view: (d) => (d === 'n' ? w.view() : undefined),
    placeWorld: (d) => (d !== 'n' ? undefined : { hasTemplate: () => true, isLoaded: () => true, place: (id, o) => events.push(`place ${o.join(',')}`), fill: () => {}, edit: w.edit() }),
    hooks: () => ({
      fillChest: () => {},
      spawnGuard: (ctx) => {
        if (peaceful) throw new Error('EntitySpawnError: Attempting to spawn a hostile mob in a peaceful world.');
        events.push(`guard ${ctx.instance.id}#${ctx.index}`);
      },
    }),
  };
  const rt = new StrfRuntime(store, engine);
  // Two bastions reserved far apart and queued, as a restart finds them.
  rt.registry.plan({ def: 'bastion', dim: 'n', origin: [160, 46, 160], rot: 0, size: [...BASTION_SIZE], id: 'bastion:n:10:10' });
  rt.registry.plan({ def: 'bastion', dim: 'n', origin: [960, 46, 960], rot: 0, size: [...BASTION_SIZE], id: 'bastion:n:60:60' });
  const planned = () => rt.registry.allInstances().filter((i) => i.def === 'bastion');
  assert.equal(rt.resumeUnfinished(), 2);
  assert.equal(planned().length, 2);
  for (let i = 0; i < 6; i++) rt.pumpPlacement();
  const states = planned().map((i) => i.state).sort();
  assert.deepEqual(states, ['looted', 'looted'], `both reach their guard step: ${states.join(',')}`);
  assert.equal(events.filter((e) => e.startsWith('place')).length, 2, 'the second bastion was never placed');
  assert.equal(rt.queued, 2, 'a waiting guard step left the queue');
  peaceful = false;
  for (let i = 0; i < 4; i++) rt.pumpPlacement();
  assert.deepEqual(planned().map((i) => i.state), ['done', 'done']);
  const guards = events.filter((e) => e.startsWith('guard'));
  assert.equal(guards.length, planned().reduce((s, i) => s + piglinCount(i.id) + 2, 0), 'a guard spawned twice or never');
  assert.equal(new Set(guards).size, guards.length);
});

// ------------------------------------------------------------------ the engine spawn of a named guard

test('engineSpawnGuard: a named guard is summoned by command with its name, then tagged; Peaceful throws before any command', () => {
  const { engineSpawnGuard } = m;
  const made = [];
  const commands = [];
  const entity = (id, name) => {
    const e = {
      id, name, tags: [], runs: [], addTag: (t) => e.tags.push(t), runCommand: (c) => (e.runs.push(c), { successCount: 1 }),
      getEffect: (type) => (type === 'fire_resistance' && e.runs.some((r) => r.startsWith('effect @s fire_resistance infinite')) ? { duration: -1 } : undefined),
    };
    return e;
  };
  const dim = {
    spawnEntity: (type, loc) => { const e = entity(`s${made.length}`, ''); made.push({ type, loc, e }); return e; },
    runCommand: (c) => {
      commands.push(c);
      const name = /^summon \S+ "((?:[^"\\]|\\.)*)"/.exec(c)[1].replace(/\\(.)/g, '$1');
      made.push({ type: c.split(' ')[1], e: entity(`c${made.length}`, name) });
      return { successCount: 1 };
    },
    getEntities: (q) => made.filter((x) => x.type === q.type && x.e.name === q.name).map((x) => x.e),
  };
  let peaceful = false;
  const spawn = engineSpawnGuard(dim, { peaceful: () => peaceful });
  const inst = { id: 'bastion:n:1:2' };
  const g = garrison(inst.id)[0];
  const e = spawn({ ...g, instance: inst, index: 0, pos: [10, 46, -3] });
  assert.deepEqual(commands, [`summon ${BRUTE} "${g.name}" 10.5 46 -2.5`]);
  assert.deepEqual(e.tags, g.tags);
  assert.deepEqual(e.runs, ['effect @s fire_resistance infinite 0 true']);
  // A second guard of the same name next to the first is told apart by id.
  const e2 = spawn({ ...garrison(inst.id)[1], name: g.name, instance: inst, index: 1, pos: [10, 46, -2] });
  assert.notEqual(e2.id, e.id);
  // A quote in a name cannot end the argument.
  spawn({ entity: PIGLIN, local: [0, 0, 0], tags: [], name: 'a "b" \\c', instance: inst, index: 2, pos: [0, 0, 0] });
  assert.equal(commands.at(-1), `summon ${PIGLIN} "a \\"b\\" \\\\c" 0.5 0 0.5`);
  peaceful = true;
  const n = commands.length;
  assert.throws(() => spawn({ ...g, instance: inst, index: 3, pos: [1, 1, 1] }), /Peaceful/);
  assert.equal(commands.length, n, 'a command ran in a Peaceful world');
  // Unnamed: the plain spawn, as before.
  const u = spawn({ entity: PIGLIN, local: [0, 0, 0], tags: ['t'], instance: inst, index: 4, pos: [2, 3, 4] });
  assert.equal(u.id.startsWith('s'), true);
  assert.deepEqual(u.tags, ['t']);
});

// ------------------------------------------------------------------ a guard spawned before guards were fireproof

test('isBastionGuard + makeFireproof: a garrison guard without fire_resistance gets it once, nothing else is touched', () => {
  const { isBastionGuard, makeFireproof } = m;
  assert.equal(isBastionGuard(PIGLIN, [guardTag('bastion:n:1:2'), roleTag('piglin')]), true);
  assert.equal(isBastionGuard(BRUTE, [roleTag('treasure')]), true);
  assert.equal(isBastionGuard(PIGLIN, [guardTag('bastion:n:1:2')]), false, 'a guard tag alone is not a bastion role');
  assert.equal(isBastionGuard(PIGLIN, []), false, 'a wild piglin');
  assert.equal(isBastionGuard('minecraft:zombie_villager_v2', [roleTag('piglin')]), false);
  const runs = [];
  let effect;
  const e = { getEffect: (t) => (t === 'fire_resistance' ? effect : undefined), runCommand: (c) => (runs.push(c), (effect = { duration: -1 }), { successCount: 1 }) };
  effect = { duration: 600 };
  assert.equal(makeFireproof(e), true, 'a finite fire_resistance is not enough');
  assert.equal(makeFireproof(e), false, 'an infinite one is not given twice');
  assert.deepEqual(runs, ['effect @s fire_resistance infinite 0 true']);
});
