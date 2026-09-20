// The dev-only self-check pack (packs/selftest).
//
// Two properties matter here and neither is visible from the pack itself:
//   1. its uuids must not collide with the release packs — a collision makes
//      the engine drop one of the two, and a self-check that silently did not
//      load looks exactly like a self-check that passed;
//   2. it must never reach dist/andrew.mcaddon — that archive is what the iPad
//      imports, and a dev pack in it would run self-checks on a player's world.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateSelfTestPack } from '../scripts/validate.mjs';
import { MIN_ENGINE_VERSION, SERVER_API_VERSION } from '../scripts/targets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const behaviorDir = join(projectRoot, 'packs', 'behavior');
const resourceDir = join(projectRoot, 'packs', 'resource');
const selftestDir = join(projectRoot, 'packs', 'selftest');
const archivePath = join(projectRoot, 'dist', 'andrew.mcaddon');

const stManifest = JSON.parse(readFileSync(join(selftestDir, 'manifest.json'), 'utf-8'));
const bpManifest = JSON.parse(readFileSync(join(behaviorDir, 'manifest.json'), 'utf-8'));
const rpManifest = JSON.parse(readFileSync(join(resourceDir, 'manifest.json'), 'utf-8'));

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Every uuid a manifest declares: the header plus each module. */
function allUuids(manifest) {
  return [manifest.header.uuid, ...(manifest.modules ?? []).map((m) => m.uuid)].map((u) =>
    String(u).toLowerCase()
  );
}

test('SelfTest Pack Manifest', async (t) => {
  await t.test('format_version is 2', () => {
    assert.strictEqual(stManifest.format_version, 2);
  });

  await t.test('header carries a v4 uuid and the pinned min_engine_version', () => {
    assert.match(stManifest.header.uuid, uuidV4Regex);
    assert.deepStrictEqual(stManifest.header.min_engine_version, MIN_ENGINE_VERSION);
  });

  await t.test('declares a script module with an entry', () => {
    const scriptModule = (stManifest.modules ?? []).find((m) => m.type === 'script');
    assert.ok(scriptModule, 'selftest pack must have a script module');
    assert.strictEqual(scriptModule.entry, 'scripts/main.js');
    assert.match(scriptModule.uuid, uuidV4Regex);
  });

  await t.test(`depends on stable @minecraft/server ${SERVER_API_VERSION}, no beta modules`, () => {
    const deps = stManifest.dependencies ?? [];
    const serverDep = deps.find((d) => d.module_name === '@minecraft/server');
    assert.ok(serverDep, 'must depend on @minecraft/server');
    assert.strictEqual(serverDep.version, SERVER_API_VERSION);

    const named = deps.map((d) => d.module_name).filter((n) => typeof n === 'string');
    for (const name of named) {
      assert.doesNotMatch(name, /-(beta|preview|rc)\b/i, `${name} is not a stable module`);
    }
  });

  await t.test('depends on the behavior pack, so it loads after it', () => {
    const bpDep = (stManifest.dependencies ?? []).find((d) => d.uuid && !d.module_name);
    assert.ok(bpDep, 'must depend on the behavior pack by uuid');
    assert.strictEqual(bpDep.uuid.toLowerCase(), bpManifest.header.uuid.toLowerCase());
    assert.deepStrictEqual(bpDep.version, bpManifest.header.version);
  });

  await t.test('passes validateSelfTestPack', () => {
    // requireScriptEntry stays off: the bundled script is build output and a
    // clean clone has not produced it yet.
    const errors = validateSelfTestPack({ selftestDir, behaviorDir, resourceDir });
    assert.deepStrictEqual(
      errors.map((e) => e.message),
      [],
      'selftest manifest must validate cleanly'
    );
  });
});

test('SelfTest uuids do not collide with the release packs', () => {
  const selfIds = allUuids(stManifest);
  const releaseIds = new Set([...allUuids(bpManifest), ...allUuids(rpManifest)]);

  assert.strictEqual(new Set(selfIds).size, selfIds.length, 'selftest uuids must be pairwise distinct');

  for (const id of selfIds) {
    assert.ok(!releaseIds.has(id), `uuid ${id} is also used by a release pack`);
  }
});

test('dist/andrew.mcaddon does not contain the selftest pack', (t) => {
  if (!existsSync(archivePath)) {
    t.skip(`${archivePath} not built yet — run "npm run build" first`);
    return;
  }

  const listing = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf-8' });
  const entries = listing.split('\n').filter(Boolean);

  assert.ok(entries.length > 0, 'the archive should not be empty');

  const leaked = entries.filter((e) => /(^|\/)selftest\//i.test(e));
  assert.deepStrictEqual(leaked, [], 'the release archive must not ship the self-check pack');

  // Guard against the check passing because the entry names changed shape:
  // if the release packs are not in there either, this assertion proves nothing.
  assert.ok(
    entries.some((e) => e.startsWith('behavior/')),
    'the archive should contain the behavior pack'
  );
  assert.ok(
    entries.some((e) => e.startsWith('resource/')),
    'the archive should contain the resource pack'
  );
});
