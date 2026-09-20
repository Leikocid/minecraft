import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validatePacks } from '../scripts/validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

function fixture(name) {
  return {
    behaviorDir: join(fixturesDir, name, 'behavior'),
    resourceDir: join(fixturesDir, name, 'resource'),
  };
}

test('valid fixture passes with no errors', () => {
  const errors = validatePacks(fixture('valid'));
  assert.deepStrictEqual(
    errors.map((e) => e.message),
    [],
    'valid fixture must not report any errors'
  );
});

test('invalid uuid is rejected, naming the file and field', () => {
  const errors = validatePacks(fixture('bad-uuid'));
  assert.ok(errors.length > 0, 'must report at least one error');
  const err = errors.find((e) => e.field === 'header.uuid');
  assert.ok(err, 'must report an error on header.uuid');
  assert.match(err.file, /bad-uuid[/\\]behavior[/\\]manifest\.json$/, 'error must name the offending file');
  assert.match(err.message, /valid UUID v4/, 'error must explain the uuid is invalid');
});

test('min_engine_version != [1,26,50] is rejected, naming the file and field', () => {
  const errors = validatePacks(fixture('bad-min-engine'));
  assert.ok(errors.length > 0, 'must report at least one error');
  const err = errors.find((e) => e.field === 'header.min_engine_version');
  assert.ok(err, 'must report an error on header.min_engine_version');
  assert.match(err.file, /bad-min-engine[/\\]behavior[/\\]manifest\.json$/, 'error must name the offending file');
  assert.match(err.message, /must equal \[1,26,50\]/, 'error must state the expected value');
});

test('@minecraft/server version != 2.10.0 is rejected, naming the file and field', () => {
  const errors = validatePacks(fixture('bad-server-version'));
  assert.ok(errors.length > 0, 'must report at least one error');
  const err = errors.find((e) => e.field === 'dependencies[@minecraft/server].version');
  assert.ok(err, 'must report an error on the @minecraft/server dependency version');
  assert.match(
    err.file,
    /bad-server-version[/\\]behavior[/\\]manifest\.json$/,
    'error must name the offending file'
  );
  assert.match(err.message, /must equal "2\.10\.0"/, 'error must state the expected version');
});

test('mismatched resource pack uuid in BP dependencies is rejected, naming the file and field', () => {
  const errors = validatePacks(fixture('mismatched-rp-uuid'));
  assert.ok(errors.length > 0, 'must report at least one error');
  const err = errors.find((e) => e.field === 'dependencies[resource-pack].uuid');
  assert.ok(err, 'must report an error on the resource pack dependency uuid');
  assert.match(
    err.file,
    /mismatched-rp-uuid[/\\]behavior[/\\]manifest\.json$/,
    'error must name the offending file'
  );
  assert.match(err.message, /must equal resource pack header\.uuid/, 'error must explain the mismatch');
});

test('requireScriptEntry reports a missing compiled script entry', () => {
  const errors = validatePacks({ ...fixture('valid'), requireScriptEntry: true });
  const err = errors.find((e) => e.field === 'modules[script].entry');
  assert.ok(err, 'must report an error when scripts/main.js has not been built yet');
  assert.match(err.message, /run the build first/);
});
