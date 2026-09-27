// Per-chunk rolls and chunk discovery (src/structures/roll.ts, discovery.ts,
// config.ts): determinism, rates against the chance table, one roll per
// (chunk, def) with no relocation, the order within a chunk, the job slices.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// One bundle, so the test hook state in registry.ts is shared with roll.ts.
const bundle = await build({
  stdin: {
    contents: `
      export * from './src/structures/registry.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/config.ts';
      export * from './src/structures/roll.ts';
      export * from './src/structures/discovery.ts';`,
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});
const m = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
const {
  Registry, MemoryStore, CHANCES, ROLL_DEFS, SLICE_CEILING_MS, SLICE_BUDGET_MS,
  hash32, rollUnit, rollHit, rollRotation, buildCandidate, Discovery, chunksAround,
  installTestHook, clearTestHook,
} = m;

const SALT = 'k3x9q7w1';
const def = (id) => ROLL_DEFS.find((d) => d.id === id);

function world(site, opts = {}) {
  const store = new MemoryStore();
  store.set('andrew:st:salt', SALT);
  const reg = new Registry(store);
  return { store, reg, disc: new Discovery(reg, site, opts) };
}

/** Force outcomes for a chunk; every def not named is forced to miss there. */
function force(chunks) {
  const outcomes = [];
  for (const [cx, cz, hits, dim = 'o'] of chunks) {
    for (const d of ROLL_DEFS) outcomes.push([d.id, dim, cx, cz, hits.includes(d.id)]);
  }
  installTestHook({ outcomes });
}

function drain(disc) {
  const job = disc.job();
  while (!job.next().done);
}

const GOLDEN = [0x65b04a79, 0x687ab24e, 0x3b908072];

test('AC1: the roll is a pure function of (salt, dim, cx, cz, def)', () => {
  for (const d of ROLL_DEFS) {
    for (let i = 0; i < 2000; i++) {
      const cx = (i * 7919) % 4001 - 2000;
      const cz = (i * 104729) % 3001 - 1500;
      assert.equal(rollUnit(SALT, d.dim, cx, cz, d.id, 'roll'), rollUnit(SALT, d.dim, cx, cz, d.id, 'roll'));
      assert.equal(rollHit(SALT, d.dim, cx, cz, d), rollHit(SALT, d.dim, cx, cz, d));
      assert.equal(rollRotation(SALT, d.dim, cx, cz, d.id), rollRotation(SALT, d.dim, cx, cz, d.id));
    }
  }
  // Golden values: a change here moves every structure in every existing world.
  assert.deepEqual(
    [hash32(`${SALT}|o|0|0|windmill|roll`), hash32(`${SALT}|n|-3|17|bastion|roll`), hash32('salt|o|123|-456|warden_city|rot')],
    GOLDEN
  );
});


test('AC1: each component of the key moves the result; distinct keys give distinct hashes', () => {
  const base = [SALT, 'o', 10, -20, 'windmill', 'roll'];
  const h0 = rollUnit(...base);
  const variants = [
    ['other', 'o', 10, -20, 'windmill', 'roll'],
    [SALT, 'n', 10, -20, 'windmill', 'roll'],
    [SALT, 'o', 11, -20, 'windmill', 'roll'],
    [SALT, 'o', 10, -21, 'windmill', 'roll'],
    [SALT, 'o', 10, -20, 'airship', 'roll'],
    [SALT, 'o', 10, -20, 'windmill', 'rot'],
    // Swapped coordinates are a different chunk.
    [SALT, 'o', -20, 10, 'windmill', 'roll'],
  ];
  for (const v of variants) assert.notEqual(rollUnit(...v), h0, `same hash for ${v.join('|')}`);

  // 100 000 distinct keys over a 32-bit hash: expected collisions n²/2³³ ≈ 1.2.
  const seen = new Set();
  let collisions = 0;
  for (let cx = 0; cx < 1000; cx++) {
    for (let cz = 0; cz < 100; cz++) {
      const h = hash32(`${SALT}|o|${cx}|${cz}|windmill|roll`);
      if (seen.has(h)) collisions++;
      seen.add(h);
    }
  }
  assert.ok(collisions <= 6, `${collisions} collisions in 100 000 keys`);

  // Different salts give different maps: the hit sets of two salts barely meet.
  const hits = (salt) => {
    const out = new Set();
    for (let cx = 0; cx < 200; cx++) for (let cz = 0; cz < 200; cz++) if (rollHit(salt, 'o', cx, cz, def('warden_city'))) out.add(`${cx},${cz}`);
    return out;
  };
  const a = hits('salt-a');
  const b = hits('salt-b');
  const shared = [...a].filter((k) => b.has(k)).length;
  // Independent maps at p = 0.05 share about p² of 40 000 chunks = 100.
  assert.ok(shared < a.size / 5, `salts share ${shared} of ${a.size} hits`);
});

test('AC1: Math.random appears nowhere in the roll code, and rolling never calls it', () => {
  for (const f of ['roll.ts', 'discovery.ts', 'config.ts']) {
    const src = readFileSync(join(projectRoot, 'src', 'structures', f), 'utf-8');
    assert.doesNotMatch(src, /Math\s*\.\s*random|Math\s*\[\s*['"]random/, `${f} mentions Math.random`);
  }
  // Belt and braces: a whole discovery pass with Math.random booby-trapped.
  const original = Math.random;
  Math.random = () => {
    throw new Error('Math.random called during a roll');
  };
  try {
    const { disc } = world(() => ({ kind: 'valid', y: 64 }));
    disc.discover([{ dimensionId: 'minecraft:overworld', x: 0, z: 0 }]);
    drain(disc);
    assert.equal(disc.stats.chunks, 81);
  } finally {
    Math.random = original;
  }
});

// Under a fair hash the hit count over N chunks is Binomial(N, p), so the
// share has σ = √(p(1−p)/N). The tolerance is 4σ: a two-sided false failure
// has probability 6·10⁻⁵ per def, and the salt is fixed so the run is
// deterministic anyway. At N = 250 000 that is ±0.0008 for p = 0.01 and
// ±0.0017 for p = 0.05 — tight enough to catch a swapped chance or a biased hash.
test('AC2: hit shares match the chance table within 4σ of the sample size', () => {
  assert.deepEqual({ ...CHANCES }, { windmill: 0.01, airship: 0.02, warden_city: 0.05, bastion: 0.05 });
  const N_SIDE = 500;
  const N = N_SIDE * N_SIDE;
  for (const salt of [SALT, 'second-world']) {
    for (const d of ROLL_DEFS) {
      assert.equal(d.chance, CHANCES[d.id]);
      let hits = 0;
      for (let cx = -N_SIDE / 2; cx < N_SIDE / 2; cx++) {
        for (let cz = -N_SIDE / 2; cz < N_SIDE / 2; cz++) if (rollHit(salt, d.dim, cx, cz, d)) hits++;
      }
      const share = hits / N;
      const sigma = Math.sqrt((d.chance * (1 - d.chance)) / N);
      const tol = 4 * sigma;
      console.log(`  ${salt} ${d.id}: ${hits}/${N} = ${share.toFixed(5)} vs ${d.chance} (±${tol.toFixed(5)})`);
      assert.ok(Math.abs(share - d.chance) <= tol, `${d.id}: share ${share} outside ${d.chance} ± ${tol}`);
    }
  }
});

test('AC2: roll units are uniform (χ² over 100 buckets, p > 0.01)', () => {
  const BUCKETS = 100;
  const N = 100_000;
  const counts = new Array(BUCKETS).fill(0);
  for (let i = 0; i < N; i++) counts[Math.floor(rollUnit(SALT, 'o', i % 317, Math.floor(i / 317), 'airship', 'roll') * BUCKETS)]++;
  const expected = N / BUCKETS;
  const chi2 = counts.reduce((s, c) => s + (c - expected) ** 2 / expected, 0);
  // Critical value of χ² with 99 degrees of freedom at p = 0.01.
  assert.ok(chi2 < 134.64, `χ² = ${chi2.toFixed(1)}`);
  // Rotations spread over all four values too.
  const rots = [0, 0, 0, 0];
  for (let i = 0; i < 40_000; i++) rots[rollRotation(SALT, 'o', i % 200, Math.floor(i / 200), 'windmill')]++;
  for (const r of rots) assert.ok(Math.abs(r - 10_000) < 4 * Math.sqrt(40_000 * 0.25 * 0.75), `rotations ${rots}`);
});

test('AC2: discovery counts the same hits as the bare roll', () => {
  const { disc } = world(() => ({ kind: 'rejected', reason: 'test' }));
  let expected = Object.fromEntries(ROLL_DEFS.map((d) => [d.id, 0]));
  for (let cx = 0; cx < 120; cx++) {
    for (let cz = 0; cz < 120; cz++) {
      disc.evaluateChunk('o', cx, cz);
      for (const d of ROLL_DEFS) if (d.dim === 'o' && rollHit(SALT, 'o', cx, cz, d)) expected[d.id]++;
    }
  }
  for (const d of ROLL_DEFS) {
    const c = disc.stats.outcomes[d.id];
    const rolled = c.planned + c.existing + c.rejected + c.collision + c.pending;
    assert.equal(rolled, expected[d.id], d.id);
  }
  // The Overworld never rolls a Bastion.
  assert.equal(disc.stats.outcomes.bastion.miss + disc.stats.outcomes.bastion.rejected, 0);
});

test('AC3: a second pass over the same chunk creates no second candidate', (t) => {
  t.after(clearTestHook);
  force(chunksAround(5, 5, 4).map(([cx, cz]) => [cx, cz, cx === 5 && cz === 5 ? ['windmill'] : []]));
  const calls = [];
  const site = (c) => (calls.push(c), { kind: 'valid', y: 64 });
  const { store, reg, disc } = world(site);

  disc.discover([{ dimensionId: 'minecraft:overworld', x: 88, z: 88 }]);
  drain(disc);
  assert.equal(reg.allInstances().length, 1);
  assert.equal(reg.allInstances()[0].id, 'windmill:o:5:5');
  assert.equal(calls.length, 1);

  // Discovery again: every chunk is evaluated, nothing is queued, nothing rolls.
  disc.discover([{ dimensionId: 'minecraft:overworld', x: 88, z: 88 }]);
  assert.equal(disc.queueLength, 0);

  // A lost evaluated bit (fresh registry, chunk forced through again): the roll
  // reproduces the same candidate and finds its own record.
  const again = new Discovery(new Registry(store), site).evaluateChunk('o', 5, 5);
  assert.deepEqual(again.results, [
    { def: 'windmill', outcome: 'existing' },
    { def: 'airship', outcome: 'miss' },
    { def: 'warden_city', outcome: 'miss' },
  ]);
  assert.equal(calls.length, 1, 'the site was asked again for an existing record');
  assert.equal(new Registry(store).allInstances().length, 1);
});

test('AC3: a cancelled candidate does not move to a neighbouring chunk or come back', (t) => {
  t.after(clearTestHook);
  const around = chunksAround(5, 5, 4);
  force(around.map(([cx, cz]) => [cx, cz, cx === 5 && cz === 5 ? ['windmill'] : []]));
  const calls = [];
  const { reg, disc } = world((c) => (calls.push(c), { kind: 'rejected', reason: 'not flat' }));

  disc.discover([{ dimensionId: 'minecraft:overworld', x: 88, z: 88 }]);
  drain(disc);
  disc.discover([{ dimensionId: 'minecraft:overworld', x: 88, z: 88 }]);
  drain(disc);
  assert.equal(calls.length, 1, `site asked ${calls.length} times`);
  assert.deepEqual([calls[0].def.id, calls[0].cx, calls[0].cz], ['windmill', 5, 5]);
  assert.equal(reg.allInstances().length, 0);
  assert.equal(disc.stats.outcomes.windmill.rejected, 1);
  for (const [cx, cz] of around) assert.equal(reg.isEvaluated('o', cx, cz), true);
});

test('AC3: pending is a deferral — the same origin and rotation are retried', (t) => {
  t.after(clearTestHook);
  force([[2, -3, ['airship']]]);
  const calls = [];
  let loaded = false;
  const { reg, disc } = world((c) => (calls.push(c), loaded ? { kind: 'valid', y: 150 } : { kind: 'pending' }));

  const first = disc.evaluateChunk('o', 2, -3);
  assert.equal(first.evaluated, false);
  assert.equal(reg.isEvaluated('o', 2, -3), false);
  assert.deepEqual(disc.pendingDefs('o', 2, -3), ['airship']);
  loaded = true;
  disc.enqueue('o', 2, -3);
  drain(disc);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], calls[0]);
  assert.equal(reg.isEvaluated('o', 2, -3), true);
  const [inst] = reg.allInstances();
  assert.deepEqual([inst.id, inst.origin[0], inst.origin[2], inst.rot], ['airship:o:2:-3', calls[0].x, calls[0].z, calls[0].rot]);
});

const Y = { windmill: 64, airship: 70, warden_city: -45 };

test('AC4: within a chunk the order is Windmill → Airship → Warden City, later ones see earlier ones', (t) => {
  t.after(clearTestHook);
  force([[0, 0, ['windmill', 'airship', 'warden_city', 'bastion']]]);
  const order = [];
  const { reg, disc } = world((c) => (order.push(c.def.id), { kind: 'valid', y: Y[c.def.id] }));

  const res = disc.evaluateChunk('o', 0, 0);
  assert.deepEqual(order, ['windmill', 'airship', 'warden_city']);
  assert.deepEqual(
    res.results.map((r) => [r.def, r.outcome, r.reason]),
    [
      ['windmill', 'planned', undefined],
      // Airship box y 70..76 cuts the Windmill (y 64..93): cancelled, not moved.
      ['airship', 'collision', 'windmill:o:0:0'],
      // Warden City y -45..-31 lies well under the Windmill: both stand.
      ['warden_city', 'planned', undefined],
    ]
  );
  assert.deepEqual(reg.allInstances().map((i) => i.id).sort(), ['warden_city:o:0:0', 'windmill:o:0:0']);
  assert.equal(res.evaluated, true);
});

test('AC4: different structures on one chunk coexist when they do not intersect', (t) => {
  t.after(clearTestHook);
  force([[4, 9, ['windmill', 'airship', 'warden_city']]]);
  const ys = { windmill: 64, airship: 150, warden_city: -45 };
  const { reg, disc } = world((c) => ({ kind: 'valid', y: ys[c.def.id] }));
  const res = disc.evaluateChunk('o', 4, 9);
  assert.deepEqual(res.results.map((r) => r.outcome), ['planned', 'planned', 'planned']);
  assert.equal(reg.allInstances().length, 3);
});

test('AC4: a later def waits behind a pending earlier one instead of taking its spot', (t) => {
  t.after(clearTestHook);
  force([[1, 1, ['windmill', 'airship']]]);
  let loaded = false;
  const order = [];
  const { reg, disc } = world((c) => {
    order.push(c.def.id);
    if (c.def.id === 'windmill' && !loaded) return { kind: 'pending' };
    return { kind: 'valid', y: Y[c.def.id] };
  });
  const first = disc.evaluateChunk('o', 1, 1);
  assert.deepEqual(first.results.map((r) => r.outcome), ['pending', 'pending', 'miss']);
  assert.equal(reg.allInstances().length, 0);
  loaded = true;
  const second = disc.evaluateChunk('o', 1, 1);
  assert.deepEqual(second.results.map((r) => [r.def, r.outcome]), [['windmill', 'planned'], ['airship', 'collision']]);
  assert.deepEqual(order, ['windmill', 'windmill', 'airship']);
});

test('dimension lock: the End rolls nothing, the Nether only the Bastion', () => {
  const { disc } = world(() => ({ kind: 'valid', y: 40 }));
  disc.discover([{ dimensionId: 'minecraft:the_end', x: 0, z: 0 }]);
  assert.equal(disc.queueLength, 0);
  const res = disc.evaluateChunk('n', 3, 3);
  assert.deepEqual(res.results.map((r) => r.def), ['bastion']);
});

test('candidate footprint is centred on the rolled chunk, rotation swaps x and z', () => {
  for (let i = 0; i < 200; i++) {
    const c = buildCandidate(SALT, 'o', i - 100, 50 - i, def('airship'));
    assert.equal(c.x + Math.floor(c.size[0] / 2), c.cx * 16 + 8);
    assert.equal(c.z + Math.floor(c.size[2] / 2), c.cz * 16 + 8);
    assert.deepEqual(c.size, c.rot % 2 === 0 ? [28, 11, 7] : [7, 11, 28]);
  }
});

test('job: yields on the budget, records slice times, ends when the queue drains', () => {
  let clock = 0;
  // Every chunk costs 1 ms of fake time.
  const { disc } = world(() => ({ kind: 'rejected', reason: 't' }), { now: () => clock, budgetMs: SLICE_BUDGET_MS });
  const real = disc.evaluateChunk.bind(disc);
  disc.evaluateChunk = (...a) => ((clock += 1), real(...a));
  disc.discover([{ dimensionId: 'minecraft:overworld', x: 0, z: 0 }]);
  const total = disc.queueLength;
  let yields = 0;
  let ran = false;
  disc.pump((job) => {
    ran = true;
    while (!job.next().done) yields++;
  });
  assert.ok(ran);
  assert.equal(disc.isRunning, false);
  assert.equal(disc.queueLength, 0);
  assert.equal(disc.stats.chunks, total);
  assert.equal(yields, Math.ceil(total / SLICE_BUDGET_MS) - 1);
  assert.equal(disc.stats.maxSliceMs, SLICE_BUDGET_MS);
  assert.ok(SLICE_CEILING_MS > SLICE_BUDGET_MS);
  // Empty queue: the worker is not scheduled at all.
  disc.pump(() => assert.fail('job started with an empty queue'));
});

test('back-pressure: the queue never exceeds its limit, dropped chunks stay unevaluated', () => {
  const { reg, disc } = world(() => ({ kind: 'rejected', reason: 't' }), { radius: 30 });
  disc.discover([{ dimensionId: 'minecraft:overworld', x: 0, z: 0 }]);
  assert.equal(disc.queueLength, 2048);
  assert.equal(disc.stats.dropped, 61 * 61 - 2048);
  // The oldest entries go first; they come back when a player is near them again.
  assert.equal(reg.isEvaluated('o', 0, 0), false);
});
