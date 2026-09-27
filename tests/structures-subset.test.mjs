// Staged rollout (STRF-SUBSET-01): which structure types are enabled lives in
// the world (EnabledTypes over the registry's store), not in the build. A world
// with no stored set enables nothing; /andrew:structure enable|disable changes
// it; a disabled type neither rolls nor passes the command, and disabling
// leaves what exists alone. The release pack carries every template but the probes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStructures, isProbe, listTemplates } from '../scripts/build-structures.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function load() {
  const bundle = await build({
    stdin: {
      contents: `
        export * from './src/structures/commands.ts';
        export * from './src/structures/config.ts';
        export * from './src/structures/runtime.ts';
        export * from './src/structures/roll.ts';
        export * from './src/structures/store.ts';
        export * from './src/structures/registry.ts';
        export * from './src/structures/bodies.ts';
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
  const src = bundle.outputFiles[0].text + `\n// ${Math.random()}`;
  return import('data:text/javascript;base64,' + Buffer.from(src, 'utf-8').toString('base64'));
}

const m = await load();
const { TYPES, execute, StrfRuntime, MemoryStore, SALT_KEY, ENABLED_KEY, EnabledTypes, enabledLine, setChanceOverride, BODIES, standIn, CUSTOM_TABLE } = m;

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

/**
 * A runtime over the world's own EnabledTypes (what src/main.ts passes), with
 * every type standing in with the probe box: without the gate a command would
 * place that box, so a refusal here is the gate and nothing else.
 */
function world({ store = new MemoryStore() } = {}) {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, 'node-subset');
  const blocks = new Map();
  const placed = [];
  const engine = {
    view: () => flatView(),
    placeWorld: () => ({
      hasTemplate: (id) => id === 'andrew:probe_box',
      isLoaded: () => true,
      place: (id, origin) => {
        placed.push(`${id} ${origin.join(',')}`);
        blocks.set(origin.join(','), id);
      },
      fill: () => {},
    }),
    hooks: () => ({ fillChest: () => {} }),
  };
  const rt = new StrfRuntime(store, engine, {
    enabled: new EnabledTypes(store),
    bodies: {
      ...BODIES,
      windmill: standIn([CUSTOM_TABLE, CUSTOM_TABLE]),
      airship: standIn([CUSTOM_TABLE, CUSTOM_TABLE]),
      warden_city: standIn(['chests/ancient_city', 'chests/ancient_city']),
      bastion: standIn(['chests/bastion_treasure', 'chests/bastion_other']),
    },
  });
  return { rt, store, blocks, placed };
}

const caller = (at = { x: 100, y: GROUND + 1, z: 200 }, dimensionId = 'minecraft:overworld') => {
  const c = { permitted: true, dimensionId, location: at, teleports: [], teleport: (to) => c.teleports.push(to) };
  return c;
};
const NETHER = 'minecraft:nether';
const callerFor = (type) => caller(undefined, type === 'bastion' ? NETHER : 'minecraft:overworld');
const keysOf = (replies) => replies.map((r) => r.message.translate);
const findDeps = { host: () => ({}), deliver: () => {} };

/** Every type certain to hit: a roll that is made at all shows up in the outcome counts. */
function rollEverything(rt) {
  for (const t of TYPES) setChanceOverride(t, 1);
  try {
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(...rt.discovery.evaluateChunk('o', 10 + i * 20, 10).results, ...rt.discovery.evaluateChunk('n', 10 + i * 20, 10).results);
    }
    return results;
  } finally {
    for (const t of TYPES) setChanceOverride(t, undefined);
  }
}

const rolledTypes = (rt) => TYPES.filter((t) => Object.values(rt.discovery.stats.outcomes[t]).some((n) => n > 0));

/** The command's refusal for a type, by every action that takes one. */
function refusals(rt, type) {
  const c = callerFor(type);
  return {
    place: execute(rt, 'place', c, type, 0),
    find: execute(rt, 'find', c, type, undefined, undefined, findDeps),
    locate: execute(rt, 'locate', c, type),
    tp: execute(rt, 'tp', c, type),
    chance: execute(rt, 'chance', c, type, 50),
  };
}

const typeNamesIn = (reply) => JSON.stringify(reply.message).match(/andrew\.structure\.type\.\w+/g) ?? [];

// ------------------------------------------------------------------ AC1

test('AC1: a world with no stored set enables nothing — no type rolls, the command refuses every one', () => {
  const { rt, store, placed } = world();
  assert.equal(store.get(ENABLED_KEY), undefined);
  assert.deepEqual(rt.enabled.list(), []);
  assert.equal(enabledLine(rt.enabled.list()), 'structures enabled: none (nothing generates until /andrew:structure enable)');
  assert.equal(rt.generating(), false, 'discovery would run with nothing enabled');

  const results = rollEverything(rt);
  assert.deepEqual(results, [], 'a roll was made');
  assert.deepEqual(rolledTypes(rt), []);

  for (const type of TYPES) {
    for (const [action, replies] of Object.entries(refusals(rt, type))) {
      assert.deepEqual(keysOf(replies), ['andrew.structure.disabled'], `${action} ${type}`);
      assert.equal(replies[0].ok, false);
    }
  }
  assert.deepEqual(rt.registry.allInstances(), []);
  assert.deepEqual(placed, []);
});

// ------------------------------------------------------------------ AC2

test('AC2: enable windmill enables only the Windmill; rolls are made for it and for none of the other three', () => {
  const { rt, store } = world();
  const replies = execute(rt, 'enable', caller(), 'windmill');
  assert.deepEqual(keysOf(replies), ['andrew.structure.enabled_now']);
  assert.deepEqual(typeNamesIn(replies[0]), ['andrew.structure.type.windmill']);
  assert.deepEqual(rt.enabled.list(), ['windmill']);
  assert.equal(store.get(ENABLED_KEY), 'windmill', 'the set is not in the world store');
  assert.deepEqual(new EnabledTypes(store).list(), ['windmill'], 'a restart would not see the set');

  const results = rollEverything(rt);
  assert.ok(results.length > 0 && results.every((r) => r.def === 'windmill'), JSON.stringify(results));
  assert.deepEqual(rolledTypes(rt), ['windmill']);
  assert.ok(rt.registry.allInstances().some((i) => i.def === 'windmill'), 'the forced windmill roll planned nothing');

  for (const type of ['airship', 'warden_city', 'bastion']) {
    assert.deepEqual(keysOf(execute(rt, 'place', callerFor(type), type, 0)), ['andrew.structure.disabled'], type);
  }
});

// ------------------------------------------------------------------ AC3

test('AC3: enable all enables the four; disable windmill turns off that one and leaves the rest', () => {
  const { rt } = world();
  const all = execute(rt, 'enable', caller(), 'all');
  assert.deepEqual(rt.enabled.list(), ['windmill', 'airship', 'warden_city', 'bastion']);
  assert.deepEqual(typeNamesIn(all[0]), TYPES.map((t) => `andrew.structure.type.${t}`));

  const off = execute(rt, 'disable', caller(), 'windmill');
  assert.deepEqual(rt.enabled.list(), ['airship', 'warden_city', 'bastion']);
  assert.deepEqual(keysOf(off), ['andrew.structure.enabled_now', 'andrew.structure.disable_keeps']);
  assert.deepEqual(typeNamesIn(off[0]), ['airship', 'warden_city', 'bastion'].map((t) => `andrew.structure.type.${t}`));

  rollEverything(rt);
  assert.deepEqual(rolledTypes(rt), ['airship', 'warden_city', 'bastion']);

  const none = execute(rt, 'disable', caller(), 'all');
  assert.deepEqual(keysOf(none), ['andrew.structure.enabled_none', 'andrew.structure.disable_keeps']);
  assert.deepEqual(rt.enabled.list(), []);

  assert.deepEqual(keysOf(execute(rt, 'enable', caller(), 'castle')), ['andrew.structure.need_type_or_all']);
  assert.deepEqual(keysOf(execute(rt, 'enable', caller())), ['andrew.structure.need_type_or_all']);
  const denied = execute(rt, 'enable', { ...caller(), permitted: false }, 'all');
  assert.deepEqual(keysOf(denied), ['andrew.structure.no_permission']);
  assert.deepEqual(rt.enabled.list(), [], 'a non-operator changed the set');
});

// ------------------------------------------------------------------ AC4

test('AC4: place, find, locate, tp and chance refuse a disabled type in words, and create no record and no probe box', () => {
  const { rt, placed } = world();
  execute(rt, 'enable', caller(), 'all');
  execute(rt, 'disable', caller(), 'airship');
  const before = rt.registry.allInstances().length;
  const r = refusals(rt, 'airship');
  for (const [action, replies] of Object.entries(r)) {
    assert.deepEqual(keysOf(replies), ['andrew.structure.disabled'], action);
    const w = replies[0].message.with.rawtext;
    assert.deepEqual(w[0], { translate: 'andrew.structure.type.airship' }, `${action}: the refusal does not name the type`);
    assert.deepEqual(w[1], { text: 'airship' }, `${action}: the refusal does not say how to enable it`);
  }
  assert.equal(rt.registry.allInstances().length, before, 'a record was created');
  assert.deepEqual(placed, [], 'a probe box was placed');
  assert.deepEqual(rt.placeAt('airship', 'o', 0, 0, 0), { kind: 'disabled' }, 'the runtime itself lets a disabled type through');
  assert.equal(m.chanceOverride('airship'), undefined, 'chance was changed for a disabled type');

  // The same actions on an enabled type do not answer "disabled": the gate is per type.
  const ok = execute(rt, 'place', caller(), 'windmill', 0);
  assert.equal(keysOf(ok)[0], 'andrew.structure.placed');
});

// ------------------------------------------------------------------ AC5

test('AC5: disable destroys nothing — records and blocks stay, and the reply says so', () => {
  const { rt, store, blocks, placed } = world();
  execute(rt, 'enable', caller(), 'windmill');
  execute(rt, 'place', caller({ x: 0, y: GROUND + 1, z: 0 }), 'windmill', 0);
  execute(rt, 'place', caller({ x: 300, y: GROUND + 1, z: 0 }), 'windmill', 0);
  const records = JSON.stringify(rt.registry.allInstances());
  const stored = JSON.stringify([...store.data].filter(([k]) => k !== ENABLED_KEY));
  const world0 = JSON.stringify([...blocks]);
  assert.equal(rt.instances('windmill').length, 2);
  assert.equal(placed.length, 2);

  const replies = execute(rt, 'disable', caller(), 'windmill');
  assert.deepEqual(keysOf(replies), ['andrew.structure.enabled_none', 'andrew.structure.disable_keeps']);

  assert.equal(JSON.stringify(rt.registry.allInstances()), records, 'a record changed');
  assert.equal(JSON.stringify([...store.data].filter(([k]) => k !== ENABLED_KEY)), stored, 'the store changed beyond the set');
  assert.equal(JSON.stringify([...blocks]), world0, 'a block changed');
  assert.ok(rt.instances('windmill').every((i) => i.state === 'done'));
  // Re-enabling finds them again, untouched.
  execute(rt, 'enable', caller(), 'windmill');
  assert.equal(keysOf(execute(rt, 'locate', caller(), 'windmill'))[0], 'andrew.structure.found');

  // The reply text itself, in both catalogs.
  for (const file of ['ru_RU.lang', 'en_US.lang']) {
    const line = readFileSync(join(projectRoot, 'packs', 'resource', 'texts', file), 'utf-8').split('\n').find((l) => l.startsWith('andrew.structure.disable_keeps='));
    assert.ok(line && /(реестр|registry)/.test(line) && /(блоки|blocks)/.test(line), `${file}: ${line}`);
  }
});

// ------------------------------------------------------------------ linked Airship

test('the linked Airship is skipped, not attempted, while the Airship is disabled', () => {
  const store = new MemoryStore();
  store.set(SALT_KEY, 'node-subset-linked');
  const enabled = new EnabledTypes(store);
  enabled.enable(['windmill']);
  const logs = [];
  const parent = { id: 'windmill:o:0:0', def: 'windmill', dim: 'o', origin: [0, 0, 0], rot: 0, size: [35, 30, 35], state: 'done', extras: {} };
  const rt = new StrfRuntime(store, { view: () => undefined, placeWorld: () => undefined, hooks: () => ({ fillChest() {} }) }, { enabled, log: (s) => logs.push(s) });
  rt.registry.plan({ def: 'windmill', dim: 'o', origin: parent.origin, rot: 0, size: parent.size, id: parent.id });
  const rec = rt.registry.get('o', parent.origin, parent.id);
  rt.registry.setExtra(rec, 'la', true);
  // The Placer's finish step calls the parent's linked hook; the runtime wraps it.
  rt['startLinked'](rec);
  assert.equal(rt.linked.attempts.size, 0);
  assert.equal(rt.registry.get('o', parent.origin, parent.id).extras.ls, 'skipped');
  assert.ok(logs.some((l) => l === `strf:airs linked attempt for ${parent.id} skipped: airship is not enabled`), logs.join('\n'));
  // A restart with the Airship enabled later does not make the skipped attempt up.
  enabled.enable(['airship']);
  rt.resumeUnfinished();
  assert.equal(rt.linked.attempts.size, 0);
  assert.equal(rt.linked.pendingCount, 0);
});

// ------------------------------------------------------------------ AC7

test('AC7: the release structure set is every template but the probes; the probes go to the gametest pack', () => {
  const rel = mkdtempSync(join(tmpdir(), 'andrew-subset-rel-'));
  const gt = mkdtempSync(join(tmpdir(), 'andrew-subset-gt-'));
  try {
    const ids = listTemplates().map((t) => t.id);
    assert.ok(ids.includes('probe') && ids.includes('probe_box'), `templates: ${ids}`);
    buildStructures({ to: rel, only: (id) => !isProbe(id) });
    buildStructures({ to: gt, only: isProbe, clean: false });
    assert.deepEqual(readdirSync(rel).sort(), ['airship.mcstructure', 'bastion.mcstructure', 'warden-city.mcstructure', 'windmill.mcstructure']);
    assert.deepEqual(readdirSync(gt).sort(), ['probe.mcstructure', 'probe_box.mcstructure']);
  } finally {
    rmSync(rel, { recursive: true, force: true });
    rmSync(gt, { recursive: true, force: true });
  }
});

test('AC7: dist/andrew.mcaddon holds the four structures and no probe; packs/gametest keeps the probes', (t) => {
  const archive = join(projectRoot, 'dist', 'andrew.mcaddon');
  if (!existsSync(archive)) {
    t.skip(`${archive} not built yet — run "npm run build" first`);
    return;
  }
  const listing = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf-8' }).split('\n').filter((l) => l.endsWith('.mcstructure'));
  assert.deepEqual(listing.sort(), ['airship', 'bastion', 'warden-city', 'windmill'].map((id) => `behavior/structures/andrew/${id}.mcstructure`));
  const gtDir = join(projectRoot, 'packs', 'gametest', 'structures', 'andrew');
  const gtFiles = readdirSync(gtDir);
  assert.ok(gtFiles.includes('probe.mcstructure') && gtFiles.includes('probe_box.mcstructure'), `gametest pack: ${gtFiles}`);
});
