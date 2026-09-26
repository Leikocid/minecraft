// Placement (src/structures/rotate.ts, clear.ts, place.ts): the rotation
// transform, the ≤ 32 768-cell cutting of a clear, and the place → chests →
// guards → linked → done flow with its resume after an interruption.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  stdin: {
    contents: `
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/rotate.ts';
      export * from './src/structures/clear.ts';
      export * from './src/structures/place.ts';`,
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
  Registry, MemoryStore, SALT_KEY, rotateLocal, rotatedSize, toWorld, rotateCardinal, ROTATIONS,
  sliceBox, clearBox, cells, boxOf, FILL_CELL_LIMIT, Placer, CHESTS_FILLED, LINKED_TRIED,
} = m;

// ------------------------------------------------------------------ rotate

test('rotateLocal: a bijection onto the rotated AABB at every rotation', () => {
  const size = [5, 3, 4];
  for (const rot of ROTATIONS) {
    const rs = rotatedSize(size, rot);
    const seen = new Set();
    for (let x = 0; x < size[0]; x++) for (let y = 0; y < size[1]; y++) for (let z = 0; z < size[2]; z++) {
      const p = rotateLocal([x, y, z], size, rot);
      for (let k = 0; k < 3; k++) assert.ok(p[k] >= 0 && p[k] < rs[k], `rot ${rot}: ${p} outside ${rs}`);
      seen.add(p.join(','));
    }
    assert.equal(seen.size, size[0] * size[1] * size[2], `rot ${rot} is not injective`);
  }
});

test('rotateLocal: four quarter turns are the identity; 90° is clockwise seen from above', () => {
  const size = [7, 2, 3];
  let p = [1, 1, 0];
  let s = size;
  for (let i = 0; i < 4; i++) {
    p = rotateLocal(p, s, 1);
    s = rotatedSize(s, 1);
  }
  assert.deepEqual(p, [1, 1, 0]);
  assert.deepEqual(s, size);
  // north-west corner goes to north-east under a clockwise turn
  assert.deepEqual(rotateLocal([0, 0, 0], size, 1), [size[2] - 1, 0, 0]);
  assert.equal(rotateCardinal('south', 1), 'west');
  assert.equal(rotateCardinal('north', 3), 'west');
  assert.deepEqual(toWorld([100, 64, -20], [0, 0, 0], size, 2), [106, 64, -18]);
});

// ------------------------------------------------------------------- clear

function assertTiling(box, slices, limit) {
  const covered = new Map();
  for (const s of slices) {
    assert.ok(cells(s) <= limit, `slice ${JSON.stringify(s)} has ${cells(s)} cells > ${limit}`);
    for (let k = 0; k < 3; k++) {
      assert.ok(s.min[k] >= box.min[k] && s.max[k] <= box.max[k], `slice ${JSON.stringify(s)} leaves the box`);
    }
    for (let x = s.min[0]; x <= s.max[0]; x++) for (let y = s.min[1]; y <= s.max[1]; y++) for (let z = s.min[2]; z <= s.max[2]; z++) {
      const k = `${x},${y},${z}`;
      covered.set(k, (covered.get(k) ?? 0) + 1);
    }
  }
  assert.equal(covered.size, cells(box), 'not every cell covered');
  assert.ok([...covered.values()].every((n) => n === 1), 'a cell covered twice');
}

test('sliceBox: 40x30x40 (48 000 cells, one call refuses) is cut into ≤ 32 768-cell slices covering it once', () => {
  assert.equal(FILL_CELL_LIMIT, 32768);
  const box = boxOf([-8, 70, 1000], [40, 30, 40]);
  const slices = sliceBox(box);
  assert.ok(slices.length >= 2);
  assertTiling(box, slices, FILL_CELL_LIMIT);
});

test('sliceBox: every template size of the four structures, rotated, stays within the limit', () => {
  for (const size of [[35, 30, 35], [15, 7, 12], [30, 15, 30], [20, 12, 20], [64, 64, 64], [1, 1, 1]]) {
    for (const rot of ROTATIONS) {
      const box = boxOf([3, -60, -17], rotatedSize(size, rot));
      assertTiling(box, sliceBox(box), FILL_CELL_LIMIT);
    }
  }
});

test('sliceBox: a limit smaller than one layer or one row still tiles', () => {
  for (const limit of [1, 7, 50, 999]) {
    const box = boxOf([0, 0, 0], [13, 5, 11]);
    assertTiling(box, sliceBox(box, limit), limit);
  }
  const small = boxOf([0, 0, 0], [10, 10, 10]);
  assert.equal(sliceBox(small).length, 1, 'a box under the limit is one call');
  const calls = [];
  clearBox(small, (s) => calls.push(s));
  assert.equal(calls.length, 1);
});

// ------------------------------------------------------------------- place

const DEF = 'box';
const TEMPLATE = 'andrew:probe_box';
const SIZE = [9, 5, 7];
const CHESTS = [{ local: [2, 1, 1], table: 't:a' }, { local: [6, 1, 1], table: 't:b' }, { local: [4, 1, 3], table: 't:c' }];

class FakeWorld {
  constructor({ templates = [TEMPLATE] } = {}) {
    this.templates = new Set(templates);
    this.unloaded = new Set();
    this.log = [];
  }
  hasTemplate(id) { return this.templates.has(id); }
  isLoaded(x, z) { return !this.unloaded.has(`${Math.floor(x / 16)},${Math.floor(z / 16)}`); }
  place(id, origin, rot) { this.log.push(['place', id, origin.join(','), rot]); }
  fill(s) { this.log.push(['fill', cells(s), s]); }
}

function rig({ world = new FakeWorld(), store = new MemoryStore(), clear, linked = true, failAt } = {}) {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, 's');
  const reg = new Registry(store);
  const calls = { fill: [], guards: 0, linked: 0 };
  const body = {
    templateId: TEMPLATE,
    clear,
    chests: CHESTS,
    guards: () => { calls.guards++; },
    linked: linked ? () => { calls.linked++; } : undefined,
  };
  const hooks = {
    fillChest: (ctx) => {
      if (failAt !== undefined && ctx.index === failAt) throw new Error('interrupted');
      calls.fill.push([ctx.index, ctx.table, ctx.pos.join(',')]);
    },
  };
  return { reg, world, store, calls, placer: new Placer(reg, world, { [DEF]: body }, hooks) };
}

const plan = (reg, rot = 1, origin = [32, 64, 32]) => {
  const r = reg.plan({ def: DEF, dim: 'o', origin, rot, size: rotatedSize(SIZE, rot) });
  assert.ok(r.ok);
  return r.instance;
};

test('Placer.run: place → chests in order at rotated points → guards → linked → done', () => {
  const { reg, world, calls, placer } = rig();
  const inst = plan(reg, 1);
  const r = placer.run(inst);
  assert.deepEqual(r, { place: 'placed', state: 'done' });
  assert.deepEqual(world.log, [['place', TEMPLATE, '32,64,32', 1]]);
  assert.deepEqual(
    calls.fill.map(([i, t, p]) => [i, t, p]),
    CHESTS.map((c, i) => [i, c.table, toWorld(inst.origin, c.local, SIZE, 1).join(',')])
  );
  assert.equal(calls.guards, 1);
  assert.equal(calls.linked, 1);
  const rec = reg.get('o', inst.origin, inst.id);
  assert.equal(rec.extras[CHESTS_FILLED], CHESTS.length);
  assert.equal(rec.extras[LINKED_TRIED], true);
  // Again: every step is past its predecessor, nothing runs twice.
  assert.deepEqual(placer.run(rec), { place: 'skipped', state: 'done' });
  assert.equal(calls.fill.length, CHESTS.length);
  assert.equal(calls.guards, 1);
  assert.equal(calls.linked, 1);
  assert.equal(world.log.length, 1);
});

test('Placer: interrupted chest filling resumes at the next chest after a restart, no second set', () => {
  const store = new MemoryStore();
  const first = rig({ store, failAt: 1 });
  const inst = plan(first.reg, 2);
  assert.throws(() => first.placer.run(inst), /interrupted/);
  const mid = first.reg.get('o', inst.origin, inst.id);
  assert.equal(mid.state, 'placed');
  assert.equal(mid.extras[CHESTS_FILLED], 1);
  assert.deepEqual(first.calls.fill.map(([i]) => i), [0]);
  assert.equal(first.calls.guards, 0);

  const second = rig({ store, world: first.world });
  const r = second.placer.run(second.reg.get('o', inst.origin, inst.id));
  assert.deepEqual(r, { place: 'skipped', state: 'done' });
  assert.deepEqual(second.calls.fill.map(([i]) => i), [1, 2], 'chest 0 filled again');
  assert.equal(second.calls.guards, 1);
  assert.equal(first.world.log.filter(([k]) => k === 'place').length, 1, 'placed twice');
});

test('Placer: a missing template fails the record and writes nothing', () => {
  const { reg, world, calls, placer } = rig({ world: new FakeWorld({ templates: [] }) });
  const inst = plan(reg);
  assert.deepEqual(placer.run(inst), { place: 'failed', state: 'failed' });
  assert.equal(world.log.length, 0);
  assert.equal(calls.fill.length, 0);
  assert.equal(reg.get('o', inst.origin, inst.id).extras.why, 'template-missing');
});

test('Placer: an unloaded chunk under the footprint defers every step', () => {
  const { reg, world, calls, placer } = rig();
  const inst = plan(reg, 0, [30, 64, 30]);
  world.unloaded.add('2,2');
  assert.deepEqual(placer.run(inst), { place: 'pending', state: 'pending' });
  assert.equal(world.log.length, 0);
  assert.equal(reg.get('o', inst.origin, inst.id).state, 'planned');
  world.unloaded.clear();
  placer.place(inst);
  world.unloaded.add('2,2');
  assert.equal(placer.init(reg.get('o', inst.origin, inst.id)), 'pending');
  assert.equal(calls.fill.length, 0);
  assert.equal(reg.get('o', inst.origin, inst.id).state, 'placed');
});

test('Placer: the clear is sliced, stays inside the footprint, and runs before place', () => {
  const big = [40, 30, 40];
  const { reg, world, placer } = rig({ clear: true });
  const r = reg.plan({ def: DEF, dim: 'o', origin: [0, 60, 0], rot: 0, size: [9, 5, 7] });
  // Footprints this large are only a clear test: the body's template is still the probe box.
  const inst = { ...r.instance, size: big };
  placer.write(inst);
  const fills = world.log.filter(([k]) => k === 'fill');
  assert.ok(fills.length >= 2);
  assertTiling(boxOf(inst.origin, big), fills.map(([, , s]) => s), FILL_CELL_LIMIT);
  assert.equal(world.log.at(-1)[0], 'place');

  const above = rig({ clear: { fromY: 10 } });
  const r2 = above.reg.plan({ def: DEF, dim: 'o', origin: [0, 60, 0], rot: 0, size: [9, 5, 7] });
  const area = above.placer.clearArea({ ...r2.instance, size: big });
  assert.deepEqual(area, { min: [0, 70, 0], max: [39, 89, 39] });
});

test('Placer: linked attempt is optional and runs at most once', () => {
  const { reg, calls, placer } = rig({ linked: false });
  assert.equal(placer.run(plan(reg)).state, 'done');
  assert.equal(calls.linked, 0);
});

// ------------------------------------------------------------------ static

test('template existence is checked with structureManager.get, never getPackStructureIds', () => {
  const dir = join(projectRoot, 'src', 'structures');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
    const code = readFileSync(join(dir, f), 'utf-8').replace(/\/\/.*$/gm, '');
    assert.ok(!/getPackStructureIds/.test(code), `${f} calls getPackStructureIds (returns [] for pack structures on 2.10.0)`);
  }
  const place = readFileSync(join(dir, 'place.ts'), 'utf-8');
  assert.match(place, /hasTemplate: \(id\) => api\.structureManager\.get\(id\) !== undefined/);
  const gt = readFileSync(join(projectRoot, 'src', 'gametest', 'structures-place.ts'), 'utf-8').replace(/\/\/.*$/gm, '');
  assert.ok(!/getPackStructureIds/.test(gt), 'structures-place GameTest calls getPackStructureIds');
});
