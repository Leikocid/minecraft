// CX-lgnd-07 repro: a player saved by 0.3.0 carries andrew:ws_cooldown_until
// (epoch ms, 20 s in the future). The design (ent3:27, r006:31) says the sword
// is still cooling after the upgrade. Red by the accepted L0-adr-wpn2 ruling.
// Run from the repo root: node --test docs/feedback/diagnose-CNTR-LGND-CX07-AA.repro.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const projectRoot = process.cwd();
const { build } = createRequire(join(projectRoot, 'package.json'))('esbuild');

const stub = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'x', namespace: 'mc' }));
    b.onLoad({ filter: /.*/, namespace: 'mc' }, () => ({
      loader: 'js',
      contents: `export const world = { getAllPlayers() { return globalThis.__players ?? []; } };
export const system = { runInterval(fn) { globalThis.__hud = fn; return 1; } };
export const EntityComponentTypes = { Equippable: "minecraft:equippable" };
export const EquipmentSlot = { Mainhand: "Mainhand", Offhand: "Offhand" };`,
    }));
  },
};

const out = await build({
  stdin: {
    contents: "export * from './src/legendary/cooldown.ts'; export * from './src/legendary/hud.ts';",
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'neutral', write: false, plugins: [stub],
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));

const NOW = 1_790_000_000_000;
Date.now = () => NOW;

function holderSavedBy030() {
  const props = new Map([['andrew:ws_cooldown_until', NOW + 20_000]]);
  const calls = [];
  return {
    calls,
    name: 'P', typeId: 'minecraft:player',
    getDynamicProperty: (k) => props.get(k),
    setDynamicProperty: (k, v) => (v === undefined ? props.delete(k) : props.set(k, v)),
    onScreenDisplay: { setActionBar: (m) => calls.push(m) },
    getComponent: (id) => id === 'minecraft:equippable'
      ? { getEquipment: (slot) => (slot === 'Mainhand' ? { typeId: 'andrew:web_sword' } : undefined) }
      : undefined,
  };
}

test('0.3.0 player cooling with 20 s left is still cooling after the upgrade', () => {
  const p = holderSavedBy030();
  console.log(`observed: isReady=${mod.isReady(p, 'web_sword')} remainingTicks=${mod.remainingTicks(p, 'web_sword')}`);
  globalThis.__players = [p];
  mod.registerLegendaryHud();
  globalThis.__hud();
  console.log(`observed HUD: ${JSON.stringify(p.calls.at(-1))}`);
  assert.equal(mod.isReady(p, 'web_sword'), false, 'sword reads READY — the 0.3.0 deadline is ignored');
  assert.ok(mod.remainingTicks(p, 'web_sword') > 0 && mod.remainingTicks(p, 'web_sword') <= 400);
});

test('positive control: the same deadline under the current key is honoured', () => {
  const p = holderSavedBy030();
  p.setDynamicProperty('andrew:cd_web_sword', NOW + 20_000);
  assert.equal(mod.isReady(p, 'web_sword'), false);
  assert.equal(mod.remainingTicks(p, 'web_sword'), 400);
});
