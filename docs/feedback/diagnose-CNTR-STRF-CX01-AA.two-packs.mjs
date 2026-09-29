// CNTR-STRF-CX01-AA: the L0-strf-cx01 scenario modelled on the real strf code.
// Two packs in one world = two StrfRuntime instances, each over its own store
// (dynamic properties are per pack), writing into one shared block world.
//   R: shaped exactly like src/main.ts:79-83 (EnabledTypes over the world store)
//   G: shaped like a gametest per-test runtime (MemoryStore, default enabled = all)
// Chance forced to 1 for every type: the worst case, every chunk hits.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Usage: node docs/feedback/diagnose-CNTR-STRF-CX01-AA.two-packs.mjs [repo-root]
const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { build } = createRequire(root + '/package.json')('esbuild');
const bundle = await build({
  stdin: {
    contents: `
      export * from './src/structures/config.ts';
      export * from './src/structures/runtime.ts';
      export * from './src/structures/roll.ts';
      export * from './src/structures/store.ts';
      export * from './src/structures/registry.ts';
      export * from './src/structures/bodies.ts';
      export { CUSTOM_TABLE } from './src/structures/loot.ts';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'neutral', external: ['@minecraft/server'], write: false,
});
const m = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const { StrfRuntime, MemoryStore, SALT_KEY, EnabledTypes, enabledLine, setChanceOverride, BODIES, standIn, CUSTOM_TABLE, ROLL_DEFS } = m;

const GROUND = -61;
const flatView = () => ({ minY: -64, maxY: 320, isLoaded: () => true, topmost: () => ({ y: GROUND, typeId: 'minecraft:grass_block' }), typeAt: (x, y) => (y <= GROUND ? 'minecraft:dirt' : 'minecraft:air'), contains: () => false });
const bodies = { ...BODIES, windmill: standIn([CUSTOM_TABLE, CUSTOM_TABLE]), airship: standIn([CUSTOM_TABLE, CUSTOM_TABLE]), warden_city: standIn(['chests/ancient_city', 'chests/ancient_city']), bastion: standIn(['chests/bastion_treasure', 'chests/bastion_other']) };

function pack(name, world, { releaseShaped, enableAll = false }) {
  const store = new MemoryStore();
  store.set(SALT_KEY, `salt-${name}`);
  const enabled = releaseShaped ? new EnabledTypes(store) : undefined;
  if (enableAll) new EnabledTypes(store).enable(ROLL_DEFS.map((d) => d.id));
  const engine = {
    view: () => flatView(),
    placeWorld: () => ({ hasTemplate: (id) => id === 'andrew:probe_box', isLoaded: () => true, place: (id, origin) => world.push({ pack: name, id, origin: origin.join(',') }), fill: () => {} }),
    hooks: () => ({ fillChest: () => {} }),
  };
  return new StrfRuntime(store, engine, { enabled, bodies });
}

const drain = (job) => { for (let r = job.next(); r.done !== true; r = job.next()); };
function tick(rt, players) {
  for (let i = 0; i < 50; i++) { rt.discover(players, drain); rt.pumpPlacement(1000); }
}

const PLAYER = [{ dimensionId: 'minecraft:overworld', x: 8, z: 8 }];
/** What src/main.ts playerPositions() yields in the gametest world: SimulatedPlayers are unreadable there (1bbcea5). */
const SIMULATED_ONLY = [];

function scenario(label, rOpts, rPlayers) {
  for (const d of ROLL_DEFS) setChanceOverride(d.id, 1);
  try {
    const world = [];
    const R = pack('release', world, { releaseShaped: true, ...rOpts });
    const G = pack('gametest', world, { releaseShaped: false });
    tick(R, rPlayers);
    tick(G, PLAYER);
    const chunksOf = (rt) => new Set(rt.registry.allInstances().map((i) => `${i.dim}:${Math.floor(i.origin[0] / 16)}:${Math.floor(i.origin[2] / 16)}`));
    const rc = chunksOf(R), gc = chunksOf(G);
    const shared = [...rc].filter((c) => gc.has(c)).length;
    const out = { label, releaseLine: enabledLine(R.enabled.list()), releaseGenerating: R.generating(), releaseRecords: R.registry.allInstances().length, gametestRecords: G.registry.allInstances().length, chunksWithTwoRegistries: shared, releaseBlocksPlaced: world.filter((w) => w.pack === 'release').length, gametestBlocksPlaced: world.filter((w) => w.pack === 'gametest').length };
    console.log(JSON.stringify(out));
    return out;
  } finally {
    for (const d of ROLL_DEFS) setChanceOverride(d.id, undefined);
  }
}

// Control: the gate removed (someone ran /andrew:structure enable all in this world)
// and a readable player near both packs. The model must see the double registry here,
// or it proves nothing about the as-built case.
const control = scenario('control: release enabled=all, readable player', { enableAll: true }, PLAYER);
// As built, worst case: a readable (real) player stands in the gametest world.
const asBuilt = scenario('as built: fresh world, readable player', {}, PLAYER);
// As built, as measured: only SimulatedPlayers, which the release pack cannot read.
const measured = scenario('as built: fresh world, SimulatedPlayers only', {}, SIMULATED_ONLY);
// Gate removed but only SimulatedPlayers: the second, independent barrier.
const barrier2 = scenario('release enabled=all, SimulatedPlayers only', { enableAll: true }, SIMULATED_ONLY);

assert.ok(control.chunksWithTwoRegistries > 0, 'control: the model did not reproduce the double registry');
for (const s of [asBuilt, measured, barrier2]) {
  assert.equal(s.releaseRecords, 0, `${s.label}: release planned records`);
  assert.equal(s.releaseBlocksPlaced, 0, `${s.label}: release placed blocks`);
  assert.equal(s.chunksWithTwoRegistries, 0, `${s.label}: a chunk carries two registries`);
}
console.log('two-packs: OK — control reproduces the double registry; as built, the release registry stays empty');
