// The dev-only GameTest pack (packs/gametest).
//
// This pack is the single authorised exception to "stable modules only": it
// depends on @minecraft/server-gametest, which exists in no stable channel.
// [src: concept-constraint C-2]
//
// That makes two properties worth testing, and neither is visible from the
// pack itself:
//   1. the beta dependency stays *contained* — the release packs and the
//      self-check pack must keep declaring stable modules only. A beta module
//      that drifted into packs/behavior would make the release archive require
//      an experiment the iPad's retail build cannot turn on;
//   2. the pack must never reach dist/andrew.mcaddon — that archive is what the
//      iPad imports, and this one needs a world with "Beta APIs" enabled.
//
// See docs/dev/gametest-on-bds.md for why the pack exists at all.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MIN_ENGINE_VERSION, SERVER_API_VERSION } from '../scripts/targets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const archivePath = join(projectRoot, 'dist', 'andrew.mcaddon');

const readManifest = (...parts) =>
  JSON.parse(readFileSync(join(projectRoot, 'packs', ...parts, 'manifest.json'), 'utf-8'));

const gtManifest = readManifest('gametest');
const bpManifest = readManifest('behavior');
const rpManifest = readManifest('resource');
const stManifest = readManifest('selftest');

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Matched against the module *name*, not its version. `@minecraft/server-gametest`
// has no stable channel at all, so the name alone is what makes it non-stable —
// keying on a "-beta" version string would miss it the day it is pinned to a
// version that does not carry the suffix.
const betaRegex = /-(beta|preview|rc|gametest)\b/i;

/** Every uuid a manifest declares: the header plus each module. */
function allUuids(manifest) {
  return [manifest.header.uuid, ...(manifest.modules ?? []).map((m) => m.uuid)].map((u) =>
    String(u).toLowerCase()
  );
}

/** The named module dependencies of a manifest (uuid-only deps have no name). */
function moduleNames(manifest) {
  return (manifest.dependencies ?? []).map((d) => d.module_name).filter((n) => typeof n === 'string');
}

test('GameTest Pack Manifest', async (t) => {
  await t.test('format_version is 2 and the header is pinned to the target engine', () => {
    assert.strictEqual(gtManifest.format_version, 2);
    assert.match(gtManifest.header.uuid, uuidV4Regex);
    assert.deepStrictEqual(gtManifest.header.min_engine_version, MIN_ENGINE_VERSION);
  });

  await t.test('declares a script module with an entry', () => {
    const scriptModule = (gtManifest.modules ?? []).find((m) => m.type === 'script');
    assert.ok(scriptModule, 'gametest pack must have a script module');
    assert.strictEqual(scriptModule.entry, 'scripts/main.js');
    assert.match(scriptModule.uuid, uuidV4Regex);
  });

  await t.test(`depends on stable @minecraft/server ${SERVER_API_VERSION} for everything but gametest`, () => {
    const serverDep = (gtManifest.dependencies ?? []).find((d) => d.module_name === '@minecraft/server');
    assert.ok(serverDep, 'must depend on @minecraft/server');
    assert.strictEqual(serverDep.version, SERVER_API_VERSION);
  });

  await t.test('declares the beta gametest module — this pack is the one place it may appear', () => {
    const betaDeps = moduleNames(gtManifest).filter((n) => betaRegex.test(n));
    assert.deepStrictEqual(
      betaDeps,
      ['@minecraft/server-gametest'],
      'the gametest pack should declare @minecraft/server-gametest and no other non-stable module'
    );
  });

  await t.test('depends on the behavior pack, so the pickaxe exists before the tests run', () => {
    const bpDep = (gtManifest.dependencies ?? []).find((d) => d.uuid && !d.module_name);
    assert.ok(bpDep, 'must depend on the behavior pack by uuid');
    assert.strictEqual(bpDep.uuid.toLowerCase(), bpManifest.header.uuid.toLowerCase());
  });
});

test('the beta module stays inside the gametest pack', async (t) => {
  // The containment half of C-2. Each of these packs ships to a player, so a
  // beta dependency here would demand an experiment retail Minecraft cannot
  // enable — the failure shows up as an opaque import error on the iPad.
  for (const [name, manifest] of [
    ['behavior', bpManifest],
    ['resource', rpManifest],
    ['selftest', stManifest],
  ]) {
    await t.test(`packs/${name} declares stable modules only`, () => {
      for (const moduleName of moduleNames(manifest)) {
        assert.doesNotMatch(
          moduleName,
          betaRegex,
          `packs/${name}/manifest.json depends on ${moduleName}, which is not a stable module`
        );
      }
    });
  }
});

test('GameTest uuids do not collide with the other packs', () => {
  const gtIds = allUuids(gtManifest);
  const otherIds = new Set([...allUuids(bpManifest), ...allUuids(rpManifest), ...allUuids(stManifest)]);

  assert.strictEqual(new Set(gtIds).size, gtIds.length, 'gametest uuids must be pairwise distinct');

  for (const id of gtIds) {
    // A collision makes the engine drop one of the two packs, and a test pack
    // that silently did not load looks exactly like a test run that passed.
    assert.ok(!otherIds.has(id), `uuid ${id} is also used by another pack`);
  }
});

test('dist/andrew.mcaddon does not contain the gametest pack', (t) => {
  if (!existsSync(archivePath)) {
    t.skip(`${archivePath} not built yet — run "npm run build" first`);
    return;
  }

  const listing = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf-8' });
  const entries = listing.split('\n').filter(Boolean);

  const leaked = entries.filter((e) => /(^|\/)gametest\//i.test(e));
  assert.deepStrictEqual(leaked, [], 'the release archive must not ship the gametest pack');

  // Guard against the check passing because the entry names changed shape:
  // if the release packs are not in there either, this assertion proves nothing.
  assert.ok(
    entries.some((e) => e.startsWith('behavior/')),
    'the archive should contain the behavior pack'
  );
});
