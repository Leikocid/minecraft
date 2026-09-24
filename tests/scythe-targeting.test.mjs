// Scythe target choice over plain values (spec §3, acceptance tests 1–4).
// src/scythe/targeting-rules.ts must stay free of runtime @minecraft/server
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
      contents:
        'throw new Error("src/scythe/targeting-rules.ts must stay free of runtime @minecraft/server imports");',
      loader: 'js',
    }));
  },
};

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'scythe', 'targeting-rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [minecraftServerStub],
});

const { pickTarget, rayCells, isHiddenAt, TARGET_RADIUS } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64')
);

const OW = 'minecraft:overworld';

/** Owner at the origin looking along +Z. */
const owner = { id: 'owner', location: { x: 0, y: 64, z: 0 }, dimensionId: OW, viewDirection: { x: 0, y: 0, z: 1 } };

const player = (id, x, z, extra = {}) => ({ id, location: { x, y: 64, z }, dimensionId: OW, hidden: false, ...extra });

const cases = [
  { name: 'nobody at all', candidates: [], expect: undefined },
  { name: 'only the owner in the list', candidates: [player('owner', 0, 0)], expect: undefined },
  { name: 'one player in range', candidates: [player('a', 5, 5)], expect: 'a' },
  { name: 'two players, the nearer wins', candidates: [player('far', 0, 12), player('near', 8, 0)], expect: 'near' },
  {
    name: 'equal distance, the one along the gaze wins',
    candidates: [player('side', 10, 0), player('ahead', 0, 10)],
    expect: 'ahead',
  },
  {
    name: 'within 0.5 counts as equal, gaze decides',
    candidates: [player('side', 10, 0), player('ahead', 0, 10.4)],
    expect: 'ahead',
  },
  {
    name: 'beyond 0.5 is not a tie, distance decides',
    candidates: [player('side', 10, 0), player('ahead', 0, 10.6)],
    expect: 'side',
  },
  {
    name: 'hidden player is skipped',
    candidates: [player('hidden', 3, 0, { hidden: true }), player('visible', 15, 0)],
    expect: 'visible',
  },
  { name: 'only a hidden player — no target', candidates: [player('hidden', 3, 0, { hidden: true })], expect: undefined },
  {
    name: 'player in another dimension is skipped',
    candidates: [player('nether', 1, 0, { dimensionId: 'minecraft:nether' }), player('here', 9, 0)],
    expect: 'here',
  },
  { name: 'exactly 20 blocks is in range', candidates: [player('edge', 0, TARGET_RADIUS)], expect: 'edge' },
  { name: 'beyond 20 blocks is not selected', candidates: [player('far', 0, 20.01)], expect: undefined },
  {
    name: 'distance is 3D',
    candidates: [{ id: 'high', location: { x: 12, y: 64 + 17, z: 0 }, dimensionId: OW, hidden: false }],
    expect: undefined,
  },
];

for (const c of cases) {
  test(`pickTarget: ${c.name}`, () => {
    assert.equal(pickTarget(owner, c.candidates)?.id, c.expect);
  });
}

test('pickTarget: an occluded nearer player loses to a visible farther one', () => {
  const picked = pickTarget(owner, [player('walled', 3, 0), player('open', 12, 0)], (c) => c.id !== 'walled');
  assert.equal(picked?.id, 'open');
});

test('pickTarget: an occluded player does not win a tie by gaze', () => {
  const picked = pickTarget(owner, [player('side', 10, 0), player('ahead', 0, 10)], (c) => c.id !== 'ahead');
  assert.equal(picked?.id, 'side');
});

test('pickTarget: visibility is only asked of candidates that could still win', () => {
  const asked = [];
  pickTarget(owner, [player('near', 2, 0), player('mid', 6, 0), player('far', 15, 0)], (c) => {
    asked.push(c.id);
    return true;
  });
  assert.deepEqual(asked, ['near']);
});

test('rayCells: walks every cell between the two eye cells, excluding both', () => {
  const cells = rayCells({ x: 0.5, y: 65.6, z: 0.5 }, { x: 0.5, y: 65.6, z: 4.5 });
  assert.deepEqual(
    cells.map((c) => c.z),
    [1, 2, 3]
  );
  assert.ok(cells.every((c) => c.x === 0 && c.y === 65));
});

test('isHiddenAt: only a future numeric deadline hides', () => {
  assert.equal(isHiddenAt(1000, 1001), true);
  assert.equal(isHiddenAt(1000, 1000), false);
  assert.equal(isHiddenAt(1000, undefined), false);
  assert.equal(isHiddenAt(1000, '9999'), false);
});
