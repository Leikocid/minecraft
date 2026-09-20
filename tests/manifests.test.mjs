import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read and parse manifests
const bpManifestPath = join(projectRoot, 'packs', 'behavior', 'manifest.json');
const rpManifestPath = join(projectRoot, 'packs', 'resource', 'manifest.json');

const bpManifest = JSON.parse(readFileSync(bpManifestPath, 'utf-8'));
const rpManifest = JSON.parse(readFileSync(rpManifestPath, 'utf-8'));

// UUID v4 validation regex
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuidV4(uuid) {
  return uuidV4Regex.test(uuid);
}

test('Behavior Pack Manifest', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(bpManifest, 'BP manifest should be a valid object');
  });

  await t.test('has format_version 2', () => {
    assert.strictEqual(bpManifest.format_version, 2, 'BP format_version must be 2');
  });

  await t.test('header has required fields', () => {
    assert.ok(bpManifest.header, 'BP must have header');
    assert.strictEqual(bpManifest.header.name, 'Andrew BP', 'BP header name must be "Andrew BP"');
    assert.ok(bpManifest.header.uuid, 'BP header must have uuid');
    assert.ok(bpManifest.header.version, 'BP header must have version');
    assert.deepStrictEqual(bpManifest.header.version, [0, 1, 0], 'BP version must be [0, 1, 0]');
    assert.ok(bpManifest.header.min_engine_version, 'BP header must have min_engine_version');
  });

  await t.test('header min_engine_version is [1, 26, 50]', () => {
    assert.deepStrictEqual(
      bpManifest.header.min_engine_version,
      [1, 26, 50],
      'BP min_engine_version must be [1, 26, 50]'
    );
  });

  await t.test('has two modules with uuids', () => {
    assert.ok(Array.isArray(bpManifest.modules), 'BP modules must be an array');
    assert.strictEqual(bpManifest.modules.length, 2, 'BP must have exactly 2 modules');
    assert.ok(bpManifest.modules[0].uuid, 'Data module must have uuid');
    assert.ok(bpManifest.modules[1].uuid, 'Script module must have uuid');
  });

  await t.test('script module has correct configuration', () => {
    const scriptModule = bpManifest.modules.find((m) => m.type === 'script');
    assert.ok(scriptModule, 'BP must have script module');
    assert.strictEqual(scriptModule.language, 'javascript', 'Script module language must be javascript');
    assert.strictEqual(scriptModule.entry, 'scripts/main.js', 'Script module entry must be scripts/main.js');
  });

  await t.test('has dependencies on @minecraft/server 2.10.0', () => {
    assert.ok(Array.isArray(bpManifest.dependencies), 'BP must have dependencies array');
    const serverDep = bpManifest.dependencies.find((d) => d.module_name === '@minecraft/server');
    assert.ok(serverDep, 'BP must depend on @minecraft/server');
    assert.strictEqual(serverDep.version, '2.10.0', '@minecraft/server version must be exactly 2.10.0');
  });

  await t.test('has dependency on resource pack', () => {
    assert.ok(Array.isArray(bpManifest.dependencies), 'BP must have dependencies array');
    const rpDep = bpManifest.dependencies.find((d) => d.uuid && !d.module_name);
    assert.ok(rpDep, 'BP must have dependency on resource pack (by uuid)');
    assert.strictEqual(
      rpDep.uuid,
      rpManifest.header.uuid,
      'BP resource pack dependency uuid must match RP header uuid'
    );
    assert.deepStrictEqual(rpDep.version, [0, 1, 0], 'BP resource pack dependency version must be [0, 1, 0]');
  });
});

test('Resource Pack Manifest', async (t) => {
  await t.test('parses successfully', () => {
    assert.ok(rpManifest, 'RP manifest should be a valid object');
  });

  await t.test('has format_version 2', () => {
    assert.strictEqual(rpManifest.format_version, 2, 'RP format_version must be 2');
  });

  await t.test('header has required fields', () => {
    assert.ok(rpManifest.header, 'RP must have header');
    assert.strictEqual(rpManifest.header.name, 'Andrew RP', 'RP header name must be "Andrew RP"');
    assert.ok(rpManifest.header.uuid, 'RP header must have uuid');
    assert.ok(rpManifest.header.version, 'RP header must have version');
    assert.deepStrictEqual(rpManifest.header.version, [0, 1, 0], 'RP version must be [0, 1, 0]');
    assert.ok(rpManifest.header.min_engine_version, 'RP header must have min_engine_version');
  });

  await t.test('header min_engine_version is [1, 26, 50]', () => {
    assert.deepStrictEqual(
      rpManifest.header.min_engine_version,
      [1, 26, 50],
      'RP min_engine_version must be [1, 26, 50]'
    );
  });

  await t.test('has resources module with uuid', () => {
    assert.ok(Array.isArray(rpManifest.modules), 'RP modules must be an array');
    assert.strictEqual(rpManifest.modules.length, 1, 'RP must have exactly 1 module');
    const resourcesModule = rpManifest.modules[0];
    assert.strictEqual(resourcesModule.type, 'resources', 'Module must be of type resources');
    assert.ok(resourcesModule.uuid, 'Resources module must have uuid');
  });
});

test('UUID Validation', async (t) => {
  await t.test('all uuids are valid v4 format', () => {
    const uuids = [
      bpManifest.header.uuid,
      bpManifest.modules[0].uuid,
      bpManifest.modules[1].uuid,
      rpManifest.header.uuid,
      rpManifest.modules[0].uuid,
    ];

    for (const uuid of uuids) {
      assert.ok(isValidUuidV4(uuid), `UUID ${uuid} must be valid v4 format`);
    }
  });

  await t.test('all uuids are different', () => {
    const uuids = [
      bpManifest.header.uuid,
      bpManifest.modules[0].uuid,
      bpManifest.modules[1].uuid,
      rpManifest.header.uuid,
      rpManifest.modules[0].uuid,
    ];

    const uniqueUuids = new Set(uuids);
    assert.strictEqual(
      uniqueUuids.size,
      uuids.length,
      'All uuids must be unique (pairwise distinct)'
    );
  });
});

test('No Beta/Preview versions or experimental flags', async (t) => {
  await t.test('dependencies have no beta/preview versions', () => {
    for (const dep of bpManifest.dependencies) {
      if (typeof dep.version === 'string') {
        assert.ok(
          !dep.version.includes('beta') && !dep.version.includes('preview'),
          `Dependency version "${dep.version}" must not contain beta or preview`
        );
      }
    }
  });

  await t.test('manifests have no experimental flags', () => {
    const bpStr = JSON.stringify(bpManifest);
    const rpStr = JSON.stringify(rpManifest);

    assert.ok(
      !bpStr.includes('experimental'),
      'BP manifest must not have experimental flags'
    );
    assert.ok(
      !rpStr.includes('experimental'),
      'RP manifest must not have experimental flags'
    );
  });
});
