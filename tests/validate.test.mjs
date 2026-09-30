import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

// ------------------------------------------------------------------ entities

function entityFixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'andrew-validate-'));
  cpSync(join(fixturesDir, 'valid'), dir, { recursive: true });
  for (const [path, json] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), JSON.stringify(json));
  }
  return { behaviorDir: join(dir, 'behavior'), resourceDir: join(dir, 'resource'), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const serverEntity = (events = {}) => ({
  format_version: '1.26.50',
  'minecraft:entity': {
    description: { identifier: 'andrew:fixture_entity', is_summonable: true, is_spawnable: false, properties: { 'andrew:p': { type: 'int', range: [0, 1], default: 0 } } },
    component_groups: { 'andrew:g': { 'minecraft:scale': { value: 2 } } },
    components: {},
    events,
  },
});

const clientEntity = (geometry = 'geometry.andrew.fixture', controller = 'controller.render.andrew.fixture') => ({
  format_version: '1.10.0',
  'minecraft:client_entity': {
    description: {
      identifier: 'andrew:fixture_entity',
      textures: { default: 'textures/blocks/tnt_side' },
      geometry: { default: geometry },
      render_controllers: [controller],
    },
  },
});

const clientAssets = {
  'resource/models/entity/fixture.geo.json': { format_version: '1.12.0', 'minecraft:geometry': [{ description: { identifier: 'geometry.andrew.fixture' }, bones: [] }] },
  'resource/render_controllers/fixture.render_controllers.json': {
    format_version: '1.8.0',
    render_controllers: { 'controller.render.andrew.fixture': { geometry: 'Geometry.default', textures: ['Texture.default'] } },
  },
};

function validateEntities(files) {
  const fx = entityFixture(files);
  try {
    return validatePacks(fx);
  } finally {
    fx.cleanup();
  }
}

test('an entity with its client entity, geometry and render controller passes', () => {
  const errors = validateEntities({
    'behavior/entities/fixture.json': serverEntity({ 'andrew:e': { add: { component_groups: ['andrew:g'] }, set_property: { 'andrew:p': 1 } } }),
    'resource/entity/fixture.entity.json': clientEntity(),
    ...clientAssets,
  });
  assert.deepStrictEqual(errors.map((e) => e.message), []);
});

test('a behavior-pack entity without a client entity is rejected as invisible', () => {
  const errors = validateEntities({ 'behavior/entities/fixture.json': serverEntity() });
  const err = errors.find((e) => /would be invisible/.test(e.message));
  assert.ok(err, `must report the missing client entity, got ${JSON.stringify(errors.map((e) => e.message))}`);
  assert.match(err.file, /behavior[/\\]entities[/\\]fixture\.json$/);
});

test('a client entity without a behavior-pack entity is rejected', () => {
  const errors = validateEntities({ 'resource/entity/fixture.entity.json': clientEntity(), ...clientAssets });
  assert.ok(errors.some((e) => /has no behavior-pack entity/.test(e.message)));
});

test('an andrew geometry or render controller that is not defined is rejected', () => {
  const errors = validateEntities({
    'behavior/entities/fixture.json': serverEntity(),
    'resource/entity/fixture.entity.json': clientEntity('geometry.andrew.typo', 'controller.render.andrew.typo'),
    ...clientAssets,
  });
  assert.ok(errors.some((e) => e.field === 'description.geometry.default' && /geometry\.andrew\.typo/.test(e.message)));
  assert.ok(errors.some((e) => e.field === 'description.render_controllers' && /controller\.render\.andrew\.typo/.test(e.message)));
});

test('a vanilla geometry id is not resolved against this repository', () => {
  const errors = validateEntities({
    'behavior/entities/fixture.json': serverEntity(),
    'resource/entity/fixture.entity.json': clientEntity('geometry.minecart.v1.8', 'controller.render.minecart'),
  });
  assert.deepStrictEqual(errors.map((e) => e.message), []);
});

test('an event naming an undefined component group or property is rejected', () => {
  const errors = validateEntities({
    'behavior/entities/fixture.json': serverEntity({
      'andrew:e': { add: { component_groups: ['andrew:missing'] }, remove: { component_groups: ['andrew:g'] }, set_property: { 'andrew:nope': 1 } },
    }),
    'resource/entity/fixture.entity.json': clientEntity(),
    ...clientAssets,
  });
  assert.deepStrictEqual(
    errors.map((e) => e.field).sort(),
    ['events.andrew:e.add', 'events.andrew:e.set_property']
  );
});

test('an entity outside the andrew: namespace is rejected', () => {
  const entity = serverEntity();
  entity['minecraft:entity'].description.identifier = 'minecraft:fixture_entity';
  const errors = validateEntities({ 'behavior/entities/fixture.json': entity });
  assert.ok(errors.some((e) => /must carry the andrew: namespace/.test(e.message)));
});
