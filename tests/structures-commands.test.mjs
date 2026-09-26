// /andrew:structure (src/structures/commands.ts, runtime.ts): the RU/EN key
// catalog, and the command body over a fake flat world — place through the
// registry, locate, chance through the roll, tp, and the operator gate.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function load() {
  const bundle = await build({
    stdin: {
      contents: `
        export * from './src/structures/commands.ts';
        export * from './src/structures/runtime.ts';
        export * from './src/structures/roll.ts';
        export * from './src/structures/store.ts';
        export * from './src/structures/registry.ts';
        export * from './src/structures/bodies.ts';
        export * from './src/structures/rotate.ts';
        export { CUSTOM_TABLE } from './src/structures/loot.ts';`,
      resolveDir: projectRoot,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    external: ['@minecraft/server'],
    write: false,
  });
  // A unique suffix gives a fresh module instance: what a script restart does.
  const src = bundle.outputFiles[0].text + `\n// ${Math.random()}`;
  return import('data:text/javascript;base64,' + Buffer.from(src, 'utf-8').toString('base64'));
}

const m = await load();
const { TEXT_KEYS, TYPES, execute, StrfRuntime, MemoryStore, SALT_KEY, setChanceOverride, chanceOverride, BODIES, STAND_IN_CHESTS, STAND_IN_SIZE, toWorld, standIn, CUSTOM_TABLE } = m;

// ------------------------------------------------------------------ catalog

function lang(file) {
  const out = new Map();
  for (const line of readFileSync(join(projectRoot, 'packs', 'resource', 'texts', file), 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) out.set(line.slice(0, eq).trim(), line.slice(eq + 1));
  }
  return out;
}

const placeholders = (s) => (s.match(/%s/g) ?? []).length;

for (const file of ['en_US.lang', 'ru_RU.lang']) {
  test(`catalog: every /andrew:structure reply key is in ${file}, and nothing extra`, () => {
    const texts = lang(file);
    const missing = TEXT_KEYS.filter((k) => !texts.has(k) || texts.get(k).trim() === '');
    assert.deepEqual(missing, [], `missing in ${file}`);
    const extra = [...texts.keys()].filter((k) => k.startsWith('andrew.structure.') && !TEXT_KEYS.includes(k));
    assert.deepEqual(extra, [], `keys in ${file} the command never sends`);
  });
}

test('catalog: RU and EN agree on the number of %s in every key', () => {
  const en = lang('en_US.lang');
  const ru = lang('ru_RU.lang');
  const differ = TEXT_KEYS.filter((k) => placeholders(en.get(k) ?? '') !== placeholders(ru.get(k) ?? ''));
  assert.deepEqual(differ, []);
});

test('catalog: every key a reply names is in TEXT_KEYS (refusals included)', () => {
  const rt = runtime();
  const keys = new Set();
  const walk = (msg) => {
    if (msg.translate) keys.add(msg.translate);
    for (const w of msg.with?.rawtext ?? []) walk(w);
  };
  const scenarios = [
    ['locate', op()], ['place', player(false), 'windmill'], ['place', op(), 'nope'], ['place', op(), 'windmill', 45],
    ['place', op(), 'bastion'], ['chance', op(), 'windmill', 101], ['chance', op(), 'windmill', 50], ['chance', op(), 'windmill'],
    ['locate', op(), 'airship'], ['tp', op(), 'airship'], ['place', undefined, 'windmill'],
    ['place', op(), 'windmill', 0], ['place', op(), 'windmill', 0], ['locate', op()], ['locate', op(), 'windmill'], ['tp', op(), 'windmill'],
  ];
  for (const [action, caller, type, value] of scenarios) for (const r of execute(rt, action, caller, type, value)) walk(r.message);
  setChanceOverride('windmill', undefined);
  const unknown = [...keys].filter((k) => !TEXT_KEYS.includes(k));
  assert.deepEqual(unknown, []);
  assert.ok(keys.size >= 15, `only ${keys.size} distinct keys exercised`);
});

// ------------------------------------------------------------------ fakes

const GROUND = -61;
const flatView = () => ({
  minY: -64,
  maxY: 320,
  isLoaded: () => true,
  topmost: () => ({ y: GROUND, typeId: 'minecraft:grass_block' }),
  typeAt: (x, y) => (y <= GROUND ? 'minecraft:dirt' : 'minecraft:air'),
  contains: () => false,
});

function runtime({ store = new MemoryStore(), events = [] } = {}) {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, 'node-cmd');
  let rt;
  const engine = {
    view: (d) => (d === 'o' ? flatView() : undefined),
    placeWorld: () => ({
      hasTemplate: (id) => id === 'andrew:probe_box',
      isLoaded: () => true,
      place: (id, origin) => {
        // The reservation precedes the first world write (L0-strf-r008).
        const rec = rt.registry.allInstances().find((i) => i.origin.join() === origin.join());
        events.push(`place ${id} ${origin.join(',')} record=${rec?.state}`);
      },
      fill: () => events.push('fill'),
    }),
    hooks: () => ({ fillChest: (ctx) => events.push(`chest ${ctx.index} ${ctx.table}`, ctx) }),
  };
  // The command is tested over the probe box: every type, the Windmill included, stands in.
  rt = new StrfRuntime(store, engine, { bodies: { ...BODIES, windmill: standIn([CUSTOM_TABLE, CUSTOM_TABLE]) } });
  return rt;
}

const caller = (permitted, at = { x: 100, y: GROUND + 1, z: 200 }, dimensionId = 'minecraft:overworld') => {
  const c = { permitted, dimensionId, location: at, teleports: [], teleport: (to) => c.teleports.push(to) };
  return c;
};
const op = (at) => caller(true, at);
const player = (permitted) => caller(permitted);
const keysOf = (replies) => replies.map((r) => r.message.translate);

// ------------------------------------------------------------------ place

test('place: reserves, then places, fills the chests and reaches done — one registry record', () => {
  const events = [];
  const rt = runtime({ events });
  const replies = execute(rt, 'place', op(), 'windmill', 90);
  assert.deepEqual(keysOf(replies), ['andrew.structure.placed', 'andrew.structure.stand_in']);
  const all = rt.instances('windmill');
  assert.equal(all.length, 1);
  assert.equal(all[0].state, 'done');
  assert.equal(all[0].rot, 1);
  assert.equal(all[0].origin[1], GROUND + 1, 'y comes from the site profile, not from the caller');
  assert.match(events[0], /^place andrew:probe_box .* record=planned$/);
  assert.deepEqual(events.slice(1).filter((e) => typeof e === 'string'), ['chest 0 andrew:custom', 'chest 1 andrew:custom']);
  // Centred on the caller; a stand-in reserves its 9×5×7 template, rotated to 7×5×9.
  assert.deepEqual(all[0].size, [7, 5, 9]);
  assert.deepEqual([all[0].origin[0], all[0].origin[2]], [100 - 3, 200 - 4]);
});

test('place: at every rotation both chest cells fall inside the record box, on the chest layer', () => {
  for (const deg of [0, 90, 180, 270]) {
    const events = [];
    const rt = runtime({ events });
    execute(rt, 'place', op(), 'warden_city', deg);
    const inst = rt.instances('warden_city')[0];
    assert.equal(inst?.state, 'done', `rot ${deg}`);
    const cells = events.filter((e) => typeof e === 'object').map((ctx) => ctx.pos);
    assert.equal(cells.length, STAND_IN_CHESTS.length, `rot ${deg}`);
    for (const p of cells) {
      for (let k = 0; k < 3; k++) {
        assert.ok(p[k] >= inst.origin[k] && p[k] < inst.origin[k] + inst.size[k], `rot ${deg}: chest ${p} outside ${inst.origin}+${inst.size}`);
      }
      assert.equal(p[1], inst.origin[1] + 1, `rot ${deg}: chest ${p} not on the template's chest layer`);
    }
    // Where the engine puts the template's chests: rotated inside the template's own AABB.
    const want = STAND_IN_CHESTS.map((local) => toWorld(inst.origin, local, STAND_IN_SIZE, inst.rot).join());
    assert.deepEqual(cells.map((p) => p.join()), want, `rot ${deg}`);
  }
});

test('place: a second one on the same spot is refused in words, naming the first', () => {
  const rt = runtime();
  execute(rt, 'place', op(), 'windmill', 0);
  const again = execute(rt, 'place', op(), 'windmill', 0);
  assert.equal(again[0].ok, false);
  assert.equal(again[0].message.translate, 'andrew.structure.blocked');
  const near = execute(rt, 'place', op({ x: 104, y: 0, z: 200 }), 'windmill', 0);
  assert.equal(near[0].ok, false);
  assert.match(near[0].message.translate, /andrew\.structure\.(blocked|rejected)/);
  assert.equal(rt.instances().length, 1);
});

test('place: the wrong dimension, a bad rotation, an unknown type and a site reject are refusals with text', () => {
  const rt = runtime();
  assert.equal(execute(rt, 'place', op(), 'bastion')[0].message.translate, 'andrew.structure.wrong_dimension');
  assert.equal(execute(rt, 'place', op(), 'windmill', 45)[0].message.translate, 'andrew.structure.bad_rotation');
  assert.equal(execute(rt, 'place', op(), 'castle')[0].message.translate, 'andrew.structure.need_type');
  const wet = runtime();
  wet.checker['views'] = () => ({ ...flatView(), topmost: () => ({ y: GROUND, typeId: 'minecraft:water' }) });
  const r = execute(wet, 'place', op(), 'windmill', 0);
  assert.equal(r[0].message.translate, 'andrew.structure.rejected');
  assert.equal(r[0].message.with.rawtext[1].translate, 'andrew.structure.why.liquid');
  assert.equal(wet.instances().length, 0);
});

// ------------------------------------------------------------------ locate / tp

test('locate: empty world says so; then the nearest instance and the per-type counts', () => {
  const rt = runtime();
  assert.deepEqual(keysOf(execute(rt, 'locate', op())), ['andrew.structure.empty']);
  assert.deepEqual(keysOf(execute(rt, 'locate', op(), 'windmill')), ['andrew.structure.none_of_type']);
  execute(rt, 'place', op({ x: 0, y: 0, z: 0 }), 'windmill', 0);
  execute(rt, 'place', op({ x: 300, y: 0, z: 0 }), 'windmill', 0);
  const found = execute(rt, 'locate', op({ x: 280, y: GROUND, z: 10 }), 'windmill');
  assert.equal(found[0].message.translate, 'andrew.structure.found');
  const coords = found[0].message.with.rawtext.slice(1, 4).map((w) => Number(w.text));
  assert.deepEqual(coords, [300, GROUND + 1, 0]);
  const summary = execute(rt, 'locate', op());
  assert.equal(summary[0].message.translate, 'andrew.structure.summary');
  const counts = Object.fromEntries(summary.slice(1).map((r) => [r.message.with.rawtext[0].translate.split('.').pop(), r.message.with.rawtext[1].text]));
  assert.deepEqual(counts, { windmill: '2', airship: '0', warden_city: '0', bastion: '0' });
});

test('tp: moves the caller above the nearest instance; none created is a refusal', () => {
  const rt = runtime();
  const c = op({ x: 1000, y: 0, z: 1000 });
  assert.equal(execute(rt, 'tp', c, 'windmill')[0].message.translate, 'andrew.structure.none_of_type');
  assert.equal(c.teleports.length, 0);
  execute(rt, 'place', op({ x: 40, y: 0, z: 40 }), 'windmill', 0);
  const r = execute(rt, 'tp', c, 'windmill');
  assert.equal(r[0].message.translate, 'andrew.structure.teleported');
  assert.deepEqual(c.teleports, [{ x: 40.5, y: GROUND + 1 + 5 + 1, z: 40.5 }]);
});

// ------------------------------------------------------------------ chance

test('chance: 100 turns every chunk into a candidate, 0 into none; no argument resets', () => {
  const sample = (value) => {
    const rt = runtime();
    if (value !== undefined) execute(rt, 'chance', op(), 'airship', value);
    const outcomes = { miss: 0, other: 0 };
    for (let cx = 0; cx < 12; cx++) for (let cz = 0; cz < 12; cz++) {
      for (const r of rt.discovery.evaluateChunk('o', cx * 7, cz * 7).results) {
        if (r.def !== 'airship') continue;
        outcomes[r.outcome === 'miss' ? 'miss' : 'other']++;
      }
    }
    return { outcomes, planned: rt.instances('airship').length };
  };
  const hundred = sample(100);
  assert.equal(hundred.outcomes.miss, 0, 'a chunk missed at 100');
  assert.equal(hundred.planned, 144, 'every sampled chunk fits on flat land 7 chunks apart');
  const zero = sample(0);
  assert.equal(zero.outcomes.other, 0);
  assert.equal(zero.planned, 0);
  const rt = runtime();
  const reset = execute(rt, 'chance', op(), 'airship');
  assert.deepEqual(keysOf(reset), ['andrew.structure.chance_reset', 'andrew.structure.chance_stand_in']);
  assert.equal(chanceOverride('airship'), undefined);
  assert.equal(rt.generating(), false, 'stand-in bodies do not generate on their own');
});

test('chance: out of range is refused and changes nothing; the value is not written to the store', () => {
  const store = new MemoryStore();
  const rt = runtime({ store });
  const before = store.writes;
  assert.equal(execute(rt, 'chance', op(), 'windmill', 101)[0].message.translate, 'andrew.structure.bad_chance');
  assert.equal(chanceOverride('windmill'), undefined);
  execute(rt, 'chance', op(), 'windmill', 100);
  assert.equal(chanceOverride('windmill'), 1);
  assert.equal(store.writes, before, 'chance wrote to the world store');
  setChanceOverride('windmill', undefined);
});

test('chance: a fresh script instance (a restart) starts without the override', async () => {
  setChanceOverride('bastion', 1);
  assert.equal(chanceOverride('bastion'), 1);
  const fresh = await load();
  assert.equal(fresh.chanceOverride('bastion'), undefined);
  setChanceOverride('bastion', undefined);
});

// ------------------------------------------------------------------ permission

test('permission: a non-operator is refused every action and nothing is created', () => {
  const rt = runtime();
  for (const [action, type, value] of [['place', 'windmill', 0], ['locate'], ['chance', 'windmill', 100], ['tp', 'windmill']]) {
    const r = execute(rt, action, player(false), type, value);
    assert.deepEqual(keysOf(r), ['andrew.structure.no_permission'], action);
  }
  assert.equal(rt.instances().length, 0);
  assert.equal(chanceOverride('windmill'), undefined);
});

test('bodies: every type has a body, and each stand-in names its own loot tables', () => {
  assert.deepEqual(Object.keys(BODIES).sort(), [...TYPES].sort());
  assert.deepEqual(BODIES.warden_city.chests.map((c) => c.table), ['chests/ancient_city', 'chests/ancient_city']);
  assert.deepEqual(BODIES.bastion.chests.map((c) => c.table), ['chests/bastion_treasure', 'chests/bastion_other']);
});
