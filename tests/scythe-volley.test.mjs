// Scythe volley over plain values (spec §4–5, acceptance tests 5–10).
// src/scythe/volley-rules.ts must stay free of runtime @minecraft/server
// imports; the stub below throws on load if one appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const minecraftServerStub = {
  name: 'minecraft-server-stub',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@minecraft\/server$/ }, () => ({
      path: '@minecraft/server',
      namespace: 'mc-stub',
    }));
    pluginBuild.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      contents: 'throw new Error("src/scythe/volley-rules.ts must stay free of runtime @minecraft/server imports");',
      loader: 'js',
    }));
  },
};

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'scythe', 'volley-rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const rules = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);
const {
  stepTowards,
  isHit,
  outOfRadius,
  cooldownVerdict,
  trueDamageOutcome,
  launchTick,
  PROJECTILE_COUNT,
  PROJECTILE_SPEED,
  HIT_RADIUS,
  PURSUIT_RADIUS,
  TRUE_DAMAGE,
  LAUNCH_INTERVAL_TICKS,
} = rules;

const len = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

test('spec constants: three projectiles, 3 HP, radius 20, ~0.5 s apart', () => {
  assert.equal(PROJECTILE_COUNT, 3);
  assert.equal(TRUE_DAMAGE, 3);
  assert.equal(PURSUIT_RADIUS, 20);
  assert.equal(LAUNCH_INTERVAL_TICKS, 10);
  assert.deepEqual([0, 1, 2].map(launchTick), [0, 10, 20]);
});

test('a step towards the target is exactly one speed long and points at it', () => {
  const from = { x: 0, y: 0, z: 0 };
  const to = { x: 3, y: 4, z: 12 };
  const next = stepTowards(from, to);
  assert.ok(Math.abs(len(from, next) - PROJECTILE_SPEED) < 1e-9);
  // Collinear: the remaining distance shrank by exactly one step.
  assert.ok(Math.abs(len(next, to) - (13 - PROJECTILE_SPEED)) < 1e-9);
});

test('a step with an explicit speed is normalised by that speed', () => {
  const next = stepTowards({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 2);
  assert.deepEqual(next, { x: 2, y: 0, z: 0 });
});

test('a step never overshoots: nearer than one step lands on the target', () => {
  const to = { x: 0.3, y: 0.2, z: 0 };
  assert.deepEqual(stepTowards({ x: 0, y: 0, z: 0 }, to), to);
});

test('homing: re-aiming every tick reaches a moving target', () => {
  let p = { x: 0, y: 0, z: 0 };
  let target = { x: 10, y: 0, z: 0 };
  let ticks = 0;
  while (!isHit(p, target) && ticks < 100) {
    target = { x: target.x, y: target.y, z: target.z + 0.28 }; // sprinting sideways
    p = stepTowards(p, target);
    ticks++;
  }
  assert.ok(ticks < 100, 'a sprinting target outran the projectile');
});

test('hit by distance: within the radius hits, beyond it misses', () => {
  const aim = { x: 0, y: 0, z: 0 };
  assert.equal(isHit({ x: HIT_RADIUS, y: 0, z: 0 }, aim), true);
  assert.equal(isHit({ x: 0.5, y: 0.5, z: 0.5 }, aim), true);
  assert.equal(isHit({ x: HIT_RADIUS + 0.01, y: 0, z: 0 }, aim), false);
});

test('pursuit radius is measured from the launch point, horizontally', () => {
  const launch = { x: 100, y: 64, z: 100 };
  assert.equal(outOfRadius(launch, { x: 120, y: 64, z: 100 }), false);
  assert.equal(outOfRadius(launch, { x: 120.1, y: 64, z: 100 }), true);
  assert.equal(outOfRadius(launch, { x: 112, y: 64, z: 116.1 }), true);
  // Thrown 30 blocks up by three stacked hits: still in pursuit.
  assert.equal(outOfRadius(launch, { x: 105, y: 94, z: 100 }), false);
});

test('cooldown decision table (spec §5, acceptance tests 8–9)', () => {
  const table = [
    ['left radius before any hit', 0, 'out_of_radius', 'none'],
    ['left radius after a hit', 1, 'out_of_radius', 'full'],
    ['timeout with no hit', 0, 'timeout', 'none'],
    ['timeout with a hit', 2, 'timeout', 'full'],
    ['target invalid before a hit', 0, 'target_invalid', 'none'],
    ['target invalid after a hit', 1, 'target_invalid', 'full'],
    ['all three landed', 3, 'spent', 'full'],
  ];
  for (const [label, hits, reason, expected] of table) {
    assert.equal(cooldownVerdict(hits, reason), expected, label);
  }
});

test('true damage: 3 HP by direct write, lethal at or below 3', () => {
  assert.equal(trueDamageOutcome(20), 17);
  assert.equal(trueDamageOutcome(3.5), 0.5);
  assert.equal(trueDamageOutcome(3), 'lethal');
  assert.equal(trueDamageOutcome(1), 'lethal');
});
