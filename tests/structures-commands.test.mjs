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
        export { SEARCH_RADIUS } from './src/structures/spawn-search.ts';
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
const { TEXT_KEYS, TYPES, execute, findReplies, SEARCH_RADIUS, StrfRuntime, MemoryStore, SALT_KEY, setChanceOverride, chanceOverride, BODIES, STAND_IN_CHESTS, STAND_IN_SIZE, toWorld, standIn, CUSTOM_TABLE } = m;

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
  // find: the synchronous refusals, then every shape of the result it delivers later.
  for (const [caller, type, value, at] of [[undefined, 'windmill'], [op(), 'windmill', 0], [op(), 'bastion'], [op(), 'windmill', 50]]) {
    for (const r of execute(rt, 'find', caller, type, value, at)) walk(r.message);
  }
  const base = { type: 'windmill', centre: [0, 0], radius: 50, checked: 7, rejects: { liquid: 5, uneven: 2 } };
  const inst = rt.instances('windmill')[0];
  for (const res of [base, { ...base, error: 'boom' }, { ...base, rot: 1, placement: { kind: 'rejected', reason: 'uneven' } }, { ...base, rot: 1, placement: { kind: 'placed', instance: inst } }]) {
    for (const r of findReplies(rt, res)) walk(r.message);
  }
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

function runtime({ store = new MemoryStore(), events = [], dims = ['o'] } = {}) {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, 'node-cmd');
  let rt;
  const engine = {
    view: (d) => (dims.includes(d) ? flatView() : undefined),
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
  // The command is tested over the probe box: every type, the real bodies included, stands in.
  rt = new StrfRuntime(store, engine, {
    bodies: {
      ...BODIES,
      windmill: standIn([CUSTOM_TABLE, CUSTOM_TABLE]),
      airship: standIn([CUSTOM_TABLE, CUSTOM_TABLE]),
      warden_city: standIn(['chests/ancient_city', 'chests/ancient_city']),
      bastion: standIn(['chests/bastion_treasure', 'chests/bastion_other']),
    },
  });
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

test('bodies: every type has a real body with its own loot tables', () => {
  assert.deepEqual(Object.keys(BODIES).sort(), [...TYPES].sort());
  assert.ok(Object.values(BODIES).every((b) => b.standIn === false));
  assert.deepEqual(BODIES.warden_city.chests.map((c) => c.table), Array(10).fill('chests/ancient_city'));
  assert.deepEqual(BODIES.bastion.chests.map((c) => c.table), [...Array(3).fill('chests/bastion_treasure'), ...Array(7).fill('chests/bastion_other')]);
});

// -------------------------------------------- place from the server console

test('place from the console: without coordinates it refuses by name, with them it places', () => {
  const rt = runtime();
  // Nobody stands anywhere on a dedicated server console, so the point must be given.
  assert.deepEqual(keysOf(execute(rt, 'place', undefined, 'windmill', 90)), ['andrew.structure.need_coords']);
  assert.equal(rt.instances('windmill').length, 0, 'a refusal must not leave a record behind');

  const replies = execute(rt, 'place', undefined, 'windmill', 90, { x: -40, z: 64 });
  assert.deepEqual(keysOf(replies), ['andrew.structure.placed', 'andrew.structure.stand_in']);
  const all = rt.instances('windmill');
  assert.equal(all.length, 1);
  assert.equal(all[0].state, 'done', 'the console path goes through the same state machine');
  // Centred on the given point, 7×5×9 after the 90° rotation.
  assert.deepEqual([all[0].origin[0], all[0].origin[2]], [-40 - 3, 64 - 4]);
  assert.equal(all[0].origin[1], GROUND + 1, 'the height still comes from the site profile');
});

test('place: explicit coordinates win over the feet of the player who typed it', () => {
  const rt = runtime();
  execute(rt, 'place', op(), 'windmill', 90, { x: -40, z: 64 });
  const all = rt.instances('windmill');
  assert.equal(all.length, 1);
  assert.deepEqual([all[0].origin[0], all[0].origin[2]], [-40 - 3, 64 - 4], 'placed at the coordinates, not at 100/200');
});

test('place from the console: the dimension comes from the type, not from the Overworld default', () => {
  const rt = runtime({ dims: ['o', 'n'] });
  const replies = execute(rt, 'place', undefined, 'bastion', 0, { x: 8, z: 8 });
  // The flat stand-in view cannot satisfy the Bastion's netherFloor profile, so the site
  // check refuses — and that is the point: had the console fallen back to the Overworld,
  // placeAt would have answered wrong-dimension instead, before any site check ran.
  assert.deepEqual(keysOf(replies), ['andrew.structure.rejected'], 'the dimension must not be the thing that refused');
  assert.notEqual(keysOf(replies)[0], 'andrew.structure.wrong_dimension');
});

test('place: a player in the wrong dimension is still refused — the type does not override where they stand', () => {
  const rt = runtime({ dims: ['o', 'n'] });
  const replies = execute(rt, 'place', op(), 'bastion', 0, { x: 8, z: 8 });
  assert.deepEqual(keysOf(replies), ['andrew.structure.wrong_dimension']);
  assert.equal(rt.instances('bastion').length, 0);
});

// ------------------------------------------------------------------ find

const findHost = () => {
  const h = {
    loads: 0,
    removed: 0,
    spawn: () => ({ x: 0, z: 0 }),
    async load() {
      h.loads++;
      return () => { h.removed++; };
    },
    async wait() {},
    prep: () => ({ view: flatView() }),
  };
  return h;
};

/** execute's find with a fake host; resolves with the lines delivered after the search. */
function find(rt, caller, type, value, at, host = findHost()) {
  let done;
  const later = new Promise((resolve) => { done = resolve; });
  const now = execute(rt, 'find', caller, type, value, at, { host: () => host, deliver: done });
  return { now, later, host };
}

const text = (msg) => JSON.stringify(msg);

test('find from the console: answers "started" at once, then builds at a site it searched for and reports how many it checked', async () => {
  const events = [];
  const rt = runtime({ events });
  const f = find(rt, undefined, 'windmill', 40, { x: -40, z: 64 });
  assert.deepEqual(keysOf(f.now), ['andrew.structure.find_started']);
  assert.match(text(f.now[0].message), /"text":"40"\},\{"text":"-40"\},\{"text":"64"/);
  const later = await f.later;
  assert.deepEqual(keysOf(later), ['andrew.structure.find_placed', 'andrew.structure.stand_in']);
  const all = rt.instances('windmill');
  assert.equal(all.length, 1);
  assert.equal(all[0].state, 'done', 'find places through the same state machine as place');
  assert.match(events[0], /^place andrew:probe_box .* record=planned$/, 'the record is written before the first world write');
  const c = [all[0].origin[0] + Math.floor(all[0].size[0] / 2), all[0].origin[2] + Math.floor(all[0].size[2] / 2)];
  assert.ok(Math.hypot(c[0] + 40, c[1] - 64) <= 40, `centre ${c} outside the radius`);
  // Where, how many were checked, and why the rest went: all in the one line.
  const line = text(later[0].message);
  assert.ok(line.includes(`{"text":"${c[0]}"}`) && line.includes(`{"text":"${c[1]}"}`), line);
  assert.match(line, /"with":\{"rawtext":\[.*\{"text":"\d+"\},\{"text":"[^"]+"\}\]/);
  assert.equal(f.host.loads, f.host.removed, 'every ticking area was removed');
});

test('find: from a player, the centre is where they stand; the default radius is the spawn search radius', async () => {
  const rt = runtime();
  const f = find(rt, op({ x: 300, y: GROUND + 1, z: -200 }), 'airship');
  assert.match(text(f.now[0].message), new RegExp(`"text":"${SEARCH_RADIUS}"\\},\\{"text":"300"\\},\\{"text":"-200"`));
  await f.later;
  const inst = rt.instances('airship')[0];
  assert.equal(inst?.state, 'done');
  assert.ok(Math.hypot(inst.origin[0] - 300, inst.origin[2] + 200) < 40, JSON.stringify(inst.origin));
});

test('find: refusals — no point from the console, a bad radius, the wrong dimension, no loader, a search already running', async () => {
  const rt = runtime({ dims: ['o', 'n'] });
  assert.deepEqual(keysOf(execute(rt, 'find', undefined, 'windmill', undefined, undefined, { host: findHost, deliver() {} })), ['andrew.structure.need_coords_find']);
  for (const r of [0, -5, 1001]) assert.deepEqual(keysOf(find(rt, op(), 'windmill', r).now), ['andrew.structure.bad_radius'], `radius ${r}`);
  assert.deepEqual(keysOf(find(rt, op(), 'bastion').now), ['andrew.structure.wrong_dimension']);
  assert.deepEqual(keysOf(execute(rt, 'find', op(), 'windmill')), ['andrew.structure.find_unavailable']);
  assert.deepEqual(keysOf(execute(rt, 'find', player(false), 'windmill')), ['andrew.structure.no_permission']);
  const first = find(rt, op(), 'windmill', 20);
  assert.deepEqual(keysOf(find(rt, op(), 'windmill', 20).now), ['andrew.structure.find_busy']);
  await first.later;
  const again = find(rt, op({ x: 900, y: 0, z: 900 }), 'windmill', 20);
  assert.deepEqual(keysOf(again.now), ['andrew.structure.find_started'], 'the busy flag is released when the search ends');
  await again.later;
  assert.equal(rt.instances().length, 2);
});

test('find: with no valid site in the radius the delivered answer is a refusal naming the counts, and nothing is created', async () => {
  const rt = runtime();
  const wet = { ...findHost(), prep: () => ({ view: { ...flatView(), topmost: () => ({ y: GROUND, typeId: 'minecraft:water' }) } }) };
  const f = find(rt, op(), 'windmill', 30, undefined, wet);
  const later = await f.later;
  assert.deepEqual(keysOf(later), ['andrew.structure.find_none']);
  assert.equal(later[0].ok, false);
  assert.match(text(later[0].message), /liquid=\d+/);
  assert.equal(rt.instances().length, 0);
});
