// Structure instance registry (src/structures/): init-state machine, region
// shards, evaluated-chunk bitset, the never-delete rule and the test hook.
//
// src/structures/* never imports @minecraft/server values — the world is
// passed in — so esbuild bundles it here with no stub.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASE_BUNDLE_ARGS } from '../scripts/build.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const archivePath = join(projectRoot, 'dist', 'andrew.mcaddon');
const HOOK_MARKER = 'strf-test-hook';

async function load(hook) {
  const bundle = await build({
    stdin: {
      contents: `
        export * from './src/structures/registry.ts';
        export * from './src/structures/state.ts';
        export * from './src/structures/store.ts';
        export * from './src/structures/bitset.ts';`,
      resolveDir: projectRoot,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    dropLabels: hook ? [] : ['STRF_TEST_HOOK'],
    write: false,
  });
  const text = bundle.outputFiles[0].text;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));
  return { mod, text };
}

const { mod: m } = await load(true);
const { Registry, MemoryStore, ChunkBitset, writeLong, readLong, PART_CHARS, KEY_CHAR_LIMIT } = m;

const WINDMILL = { def: 'windmill', dim: 'o', origin: [100, 64, 200], rot: 1, size: [35, 30, 35] };
const STEPS = ['place', 'loot', 'guard', 'finish'];

function fresh() {
  const store = new MemoryStore();
  return { store, reg: new Registry(store) };
}

/** Drive a planned record to the given state, counting how often each step's work ran. */
function driveTo(reg, inst, upto, ran = {}) {
  for (const step of STEPS.slice(0, STEPS.indexOf(upto) + 1)) {
    reg.runStep(inst, step, () => (ran[step] = (ran[step] ?? 0) + 1));
  }
  return ran;
}

test('AC1: init states advance planned → placed → looted → guarded → done', () => {
  const { reg } = fresh();
  const { instance } = reg.plan(WINDMILL);
  assert.equal(instance.state, 'planned');
  const seen = [];
  for (const step of STEPS) {
    assert.equal(reg.runStep(instance, step, () => {}), 'ran');
    seen.push(reg.get('o', instance.origin, instance.id).state);
  }
  assert.deepEqual(seen, ['placed', 'looted', 'guarded', 'done']);
});

test('AC1: a step does not run unless the record is in its predecessor state', async (t) => {
  const states = ['planned', 'placed', 'looted', 'guarded', 'done'];
  const pred = { place: 'planned', loot: 'placed', guard: 'looted', finish: 'guarded' };
  for (const [i, state] of states.entries()) {
    for (const step of STEPS) {
      await t.test(`${step} from ${state}`, () => {
        const { reg } = fresh();
        const { instance } = reg.plan(WINDMILL);
        if (i > 0) driveTo(reg, instance, STEPS[i - 1]);
        assert.equal(reg.get('o', instance.origin, instance.id).state, state);
        let ran = 0;
        const res = reg.runStep(instance, step, () => ran++);
        const expected = pred[step] === state;
        assert.equal(res, expected ? 'ran' : 'skipped');
        assert.equal(ran, expected ? 1 : 0);
        if (!expected) assert.equal(reg.get('o', instance.origin, instance.id).state, state);
      });
    }
  }
});

test('AC1: a step that throws leaves the state where it was', () => {
  const { reg } = fresh();
  const { instance } = reg.plan(WINDMILL);
  assert.throws(() => reg.runStep(instance, 'place', () => { throw new Error('boom'); }), /boom/);
  assert.equal(reg.get('o', instance.origin, instance.id).state, 'planned');
});

test('AC1: guarded is never reset', () => {
  const { store, reg } = fresh();
  const { instance } = reg.plan(WINDMILL);
  const ran = driveTo(reg, instance, 'guard');
  // Nothing moves it back: no earlier step, no failure, no re-plan, no restart.
  for (const step of ['place', 'loot', 'guard']) assert.equal(reg.runStep(instance, step, () => ran[step]++), 'skipped');
  assert.equal(reg.fail(instance, 'guards died'), false);
  assert.equal(reg.plan(WINDMILL).created, false);
  const again = new Registry(store);
  assert.equal(again.runStep(instance, 'guard', () => ran.guard++), 'skipped');
  assert.equal(again.get('o', instance.origin, instance.id).state, 'guarded');
  assert.deepEqual(ran, { place: 1, loot: 1, guard: 1 });
  again.runStep(instance, 'finish', () => {});
  assert.equal(again.fail(instance, 'late'), false);
  assert.equal(again.get('o', instance.origin, instance.id).state, 'done');
});

test('restart: a new Registry over the same store sees the same records and bits', () => {
  const { store, reg } = fresh();
  const a = reg.plan(WINDMILL).instance;
  const b = reg.plan({ def: 'airship', dim: 'o', origin: [-700, 120, -33], rot: 2, size: [15, 7, 12] }).instance;
  const c = reg.plan({ def: 'bastion', dim: 'n', origin: [5000, 40, -5000], rot: 3, size: [40, 30, 40] }).instance;
  driveTo(reg, a, 'finish');
  driveTo(reg, b, 'loot');
  reg.setExtra(c, 'linkedTried', true);
  const bits = [['o', 0, 0], ['o', -1, -1], ['o', 31, 31], ['o', 32, 0], ['n', -33, 7]];
  for (const [d, cx, cz] of bits) assert.equal(reg.markEvaluated(d, cx, cz), true);

  const after = new Registry(store);
  assert.deepEqual(after.allInstances(), reg.allInstances());
  assert.equal(after.allInstances().length, 3);
  for (const [d, cx, cz] of bits) assert.equal(after.isEvaluated(d, cx, cz), true, `${d} ${cx},${cz}`);
  assert.equal(after.isEvaluated('o', 1, 0), false);
  assert.equal(after.isEvaluated('n', 0, 0), false);
  assert.equal(after.stats().evaluatedChunks, bits.length);
});

test('AC3 (pure half): catching up the same step twice adds nothing', () => {
  const { store, reg } = fresh();
  const { instance } = reg.plan(WINDMILL);
  const chests = [];
  const put = () => chests.push('chest');
  reg.runStep(instance, 'place', () => {});
  assert.equal(reg.runStep(instance, 'loot', put), 'ran');
  const writes = store.writes;
  assert.equal(new Registry(store).runStep(instance, 'loot', put), 'skipped');
  assert.equal(chests.length, 1);
  assert.equal(store.writes, writes, 'a skipped step writes nothing');
});

test('AC4: a record is never deleted and keeps blocking its spot after the structure is gone', () => {
  const { store, reg } = fresh();
  const { instance } = reg.plan(WINDMILL);
  driveTo(reg, instance, 'finish');
  // The player levels the structure: the world changes, the registry does not
  // look at blocks at all. A new candidate on the same plot, from a restarted
  // server, must still be refused.
  const later = new Registry(store);
  const shifted = { def: 'airship', dim: 'o', origin: [110, 80, 210], rot: 0, size: [15, 7, 12] };
  const res = later.plan(shifted);
  assert.equal(res.ok, false);
  assert.equal(res.blockedBy.id, instance.id);
  assert.equal(later.plan({ ...WINDMILL, id: 'windmill:o:other' }).ok, false);
  // Same id is the same instance, not a second one.
  const same = later.plan(WINDMILL);
  assert.equal(same.ok && same.created, false);
  assert.equal(later.allInstances().length, 1);
  assert.equal(later.get('o', WINDMILL.origin, instance.id).state, 'done');
  // No deletion API exists on the registry.
  const methods = Object.getOwnPropertyNames(Registry.prototype);
  for (const name of methods) assert.doesNotMatch(name, /delete|remove|clear|drop|reset|forget/i);
  // A failed record blocks too.
  const f = later.plan({ def: 'airship', dim: 'o', origin: [1000, 100, 1000], rot: 0, size: [15, 7, 12] }).instance;
  assert.equal(later.fail(f, 'invalid site'), true);
  assert.equal(later.plan({ def: 'windmill', dim: 'o', origin: [1005, 98, 1005], rot: 0, size: [10, 10, 10] }).ok, false);
});

test('AC4: blocking reaches across a region border, and is per dimension', () => {
  const { reg } = fresh();
  // Origin in region -1 (chunk -1), footprint reaching into region 0.
  reg.plan({ def: 'windmill', dim: 'o', origin: [-10, 64, -10], rot: 0, size: [35, 30, 35] });
  assert.equal(reg.plan({ def: 'airship', dim: 'o', origin: [20, 80, 20], rot: 0, size: [5, 5, 5] }).ok, false);
  assert.equal(reg.plan({ def: 'airship', dim: 'n', origin: [20, 80, 20], rot: 0, size: [5, 5, 5] }).ok, true);
  assert.equal(reg.plan({ def: 'airship', dim: 'o', origin: [27, 80, 27], rot: 0, size: [5, 5, 5] }).ok, true);
});

test('collision is a 3D box with a 2-block margin (L0-strf-d004)', () => {
  const { reg } = fresh();
  // Windmill box: x/z 100..134, y 64..93.
  assert.equal(reg.plan(WINDMILL).ok, true);
  const city = { def: 'warden_city', dim: 'o', rot: 0, size: [30, 15, 30] };
  // Under the plot, top at y 49: 15 blocks below the Windmill floor.
  assert.equal(reg.plan({ ...city, origin: [102, 35, 202] }).ok, true, 'underground city under a windmill is refused');
  // Directly above, 2 blocks of air in between: allowed; 1 block: refused.
  const ship = { def: 'airship', dim: 'o', rot: 0, size: [15, 7, 12] };
  assert.equal(reg.plan({ ...ship, origin: [110, 95, 210], id: 'near' }).ok, false, 'a 1-block gap is inside the margin');
  assert.equal(reg.plan({ ...ship, origin: [110, 96, 210], id: 'far' }).ok, true, 'a 2-block gap is outside the margin');
  // Side by side in x: same rule.
  assert.equal(reg.plan({ ...ship, origin: [136, 64, 210], id: 'side1' }).ok, false);
  assert.equal(reg.plan({ ...ship, origin: [137, 64, 210], id: 'side2' }).ok, true);
});

test('evaluated bit is not set while the chunk has a pending candidate', () => {
  const { store, reg } = fresh();
  reg.deferCandidate('o', 3, 4);
  const writes = store.writes;
  assert.equal(reg.markEvaluated('o', 3, 4), false);
  assert.equal(reg.isEvaluated('o', 3, 4), false);
  assert.equal(store.writes, writes);
  reg.resolvePending('o', 3, 4);
  assert.equal(reg.markEvaluated('o', 3, 4), true);
  assert.equal(new Registry(store).isEvaluated('o', 3, 4), true);
});

test('bitset: 1024 bits, compact base64, round trip', () => {
  const b = new ChunkBitset();
  assert.equal(b.encode(), '');
  const set = [[0, 0], [31, 0], [0, 31], [31, 31], [-1, -2], [17, -5]];
  for (const [x, z] of set) b.set(x, z);
  const text = b.encode();
  assert.equal(text.length, 172);
  const back = ChunkBitset.decode(text);
  for (const [x, z] of set) assert.equal(back.has(x, z), true);
  assert.equal(back.count(), set.length);
  assert.equal(back.has(1, 1), false);
  const all = new ChunkBitset();
  for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) all.set(x, z);
  assert.equal(ChunkBitset.decode(all.encode()).count(), 1024);
});

test('store: values over the per-key limit are split and reassembled', () => {
  const s = new MemoryStore();
  const long = 'x'.repeat(PART_CHARS * 2 + 5);
  writeLong(s, 'k', long);
  assert.ok(s.keys().every((k) => s.get(k).length <= KEY_CHAR_LIMIT));
  assert.equal(readLong(s, 'k'), long);
  assert.equal(s.keys().length, 3);
  writeLong(s, 'k', '{"short":1}');
  assert.deepEqual(s.keys(), ['k']);
  assert.equal(readLong(s, 'k'), '{"short":1}');
  assert.throws(() => s.set('big', 'y'.repeat(KEY_CHAR_LIMIT + 1)), /per-key limit/);
});

test('store: a crowded region survives the split, and the size shows in the diagnostics', () => {
  const { store, reg } = fresh();
  for (let i = 0; i < 600; i++) {
    const cx = i % 32;
    const cz = Math.floor(i / 32);
    reg.plan({ def: 'airship', dim: 'o', origin: [cx * 16, 100, cz * 16], rot: 0, size: [4, 4, 4] });
    reg.markEvaluated('o', cx, cz);
  }
  const st = reg.stats();
  assert.equal(st.records, 600);
  assert.ok(st.largestShardChars > PART_CHARS, 'the test must exercise the split');
  assert.ok(st.largestRecordChars > 0 && st.largestRecordChars < 100, `record is ${st.largestRecordChars} chars`);
  assert.equal(new Registry(store).allInstances().length, 600);
  assert.match(reg.statsLine(), /records=600 .*largest-record=\d+/);
  assert.doesNotMatch(reg.statsLine(), /fail|error/i);
});

test('salt: created once, kept, and never re-created next to existing shards', () => {
  const { store, reg } = fresh();
  const s1 = reg.salt();
  assert.equal(new Registry(store).salt(), s1);
  reg.plan(WINDMILL);
  store.set('andrew:st:salt', undefined);
  assert.throws(() => new Registry(store).salt(), /refusing to re-salt/);
});

test('salt: exists by the first shard write, whatever the call order', () => {
  // Found on BDS: plan() before any salt() left shards with no salt, and the
  // next salt() refused the world as one that had lost it.
  const { store, reg } = fresh();
  reg.plan(WINDMILL);
  const s = store.get('andrew:st:salt');
  assert.ok(s, 'the first write must create the salt');
  assert.equal(reg.salt(), s);
  assert.equal(new Registry(store).salt(), s);
});

test('salt: a world that lost its salt refuses further writes', () => {
  const { store, reg } = fresh();
  reg.plan(WINDMILL);
  store.set('andrew:st:salt', undefined);
  assert.throws(() => new Registry(store).markEvaluated('o', 9, 9), /refusing to re-salt/);
});

test('schema: a newer schema version disables writes', () => {
  const { store, reg } = fresh();
  store.set('andrew:st:ver', '2');
  assert.throws(() => reg.plan(WINDMILL), /generation disabled/);
});

test('AC5: test hook overrides the salt and the outcome table', () => {
  const { reg } = fresh();
  const worldSalt = reg.salt();
  m.installTestHook({ salt: 'fixed', outcomes: [['windmill', 'o', 2, 3, true], ['airship', 'o', 2, 3, false]] });
  try {
    assert.equal(reg.salt(), 'fixed');
    assert.equal(m.forcedOutcome('windmill', 'o', 2, 3), true);
    assert.equal(m.forcedOutcome('airship', 'o', 2, 3), false);
    assert.equal(m.forcedOutcome('windmill', 'o', 2, 4), undefined);
  } finally {
    m.clearTestHook();
  }
  assert.equal(reg.salt(), worldSalt);
  assert.equal(m.forcedOutcome('windmill', 'o', 2, 3), undefined);
});

test('AC5: with the hook compiled out, it is inert', async () => {
  const { mod, text } = await load(false);
  assert.equal(mod.testHookCompiled(), false);
  assert.throws(() => mod.installTestHook({ salt: 'x' }), /not compiled/);
  assert.equal(mod.forcedOutcome('windmill', 'o', 0, 0), undefined);
  assert.equal(text.includes(HOOK_MARKER), false);
});

test('AC5: the release script bundle carries the registry but not the test hook', async () => {
  const out = execFileSync(join(projectRoot, 'node_modules', '.bin', 'esbuild'), RELEASE_BUNDLE_ARGS, {
    cwd: projectRoot,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  assert.match(out, /strf registry: shards=/, 'the registry must be in the release bundle for this check to mean anything');
  assert.equal(out.includes(HOOK_MARKER), false);
  // Positive control: the same marker survives when the hook is compiled in.
  const { text } = await load(true);
  assert.equal(text.includes(HOOK_MARKER), true);
});

test('AC5: dist/andrew.mcaddon does not contain the test hook', (t) => {
  if (!existsSync(archivePath)) {
    t.skip(`${archivePath} not built yet — run "npm run build" first`);
    return;
  }
  const listing = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf-8' }).split('\n').filter(Boolean);
  const scripts = listing.filter((f) => f.endsWith('.js'));
  assert.ok(scripts.includes('behavior/scripts/main.js'), `archive scripts: ${scripts.join(' ')}`);
  for (const f of scripts) {
    const body = execFileSync('unzip', ['-p', archivePath, f], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
    assert.equal(body.includes(HOOK_MARKER), false, `${f} contains the strf test hook`);
    // Freshness guard: a marker only the current code emits. Without it this test
    // passes on a stale archive that predates the structures module entirely.
    if (f === 'behavior/scripts/main.js') {
      assert.ok(
        /strf registry: shards=/.test(body),
        `${archivePath} is stale — it has no structures registry diagnostic. Run "npm run build" and re-run.`
      );
    }
  }
});
