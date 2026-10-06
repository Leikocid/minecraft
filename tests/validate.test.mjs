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
    writeFileSync(join(dir, path), Buffer.isBuffer(json) ? json : JSON.stringify(json));
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

// ------------------------------------------------------------------ attachables

const attachable = ({ id = 'andrew:fixture_item', geometry = 'geometry.andrew.held', animation = 'animation.andrew.held.pull', controller = 'controller.render.andrew.held', texture = 'textures/items/andrew_held' } = {}) => ({
  format_version: '1.10.0',
  'minecraft:attachable': {
    description: {
      identifier: id,
      materials: { default: 'entity_alphatest' },
      textures: { default: texture },
      geometry: { default: geometry },
      animations: { pull: animation },
      scripts: { animate: ['pull'] },
      render_controllers: [controller],
    },
  },
});

const heldAssets = (bones = ['root', 'string']) => ({
  'resource/models/entity/held.geo.json': { format_version: '1.16.0', 'minecraft:geometry': [{ description: { identifier: 'geometry.andrew.held' }, bones: bones.map((name) => ({ name, pivot: [0, 0, 0] })) }] },
  'resource/animations/held.animation.json': { format_version: '1.8.0', animations: { 'animation.andrew.held.pull': { loop: true, bones: { string: { position: [0, 0, 'v.draw'] } } } } },
  'resource/render_controllers/held.render_controllers.json': {
    format_version: '1.8.0',
    render_controllers: { 'controller.render.andrew.held': { geometry: 'Geometry.default', materials: [{ '*': 'Material.default' }], textures: ['Texture.default'] } },
  },
  'resource/textures/items/andrew_held.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
});

test('an attachable with its item, geometry, animation, controller and texture passes', () => {
  const errors = validateEntities({ 'resource/attachables/held.json': attachable(), ...heldAssets() });
  assert.deepStrictEqual(errors.map((e) => e.message), []);
});

test('the shipped Sculk Crossbow attachable resolves against the real packs', () => {
  const errors = validatePacks({ behaviorDir: join(__dirname, '..', 'packs', 'behavior'), resourceDir: join(__dirname, '..', 'packs', 'resource') });
  assert.deepStrictEqual(errors.filter((e) => /attachables/.test(e.file)).map((e) => e.message), []);
});

test('an attachable for an item that does not exist is rejected', () => {
  const errors = validateEntities({ 'resource/attachables/held.json': attachable({ id: 'andrew:no_such_item' }), ...heldAssets() });
  assert.ok(errors.some((e) => e.field === 'minecraft:attachable.description.identifier' && /andrew:no_such_item has no behavior-pack item/.test(e.message)));
});

test('an attachable naming a missing geometry, animation, controller or texture is rejected', () => {
  const errors = validateEntities({
    'resource/attachables/held.json': attachable({
      geometry: 'geometry.andrew.typo',
      animation: 'animation.andrew.typo',
      controller: 'controller.render.andrew.typo',
      texture: 'textures/items/andrew_typo',
    }),
    ...heldAssets(),
  });
  assert.deepStrictEqual(
    errors.map((e) => e.field).sort(),
    ['description.animations.pull', 'description.geometry.default', 'description.render_controllers', 'description.textures.default']
  );
});

test('an attachable animation moving a bone its geometry lacks is rejected', () => {
  const errors = validateEntities({ 'resource/attachables/held.json': attachable(), ...heldAssets(['root']) });
  assert.ok(errors.some((e) => /moves bone string, which the attachable's geometry does not have/.test(e.message)));
});

test('a controller asking for a texture key the attachable does not define is rejected', () => {
  const assets = heldAssets();
  assets['resource/render_controllers/held.render_controllers.json'].render_controllers['controller.render.andrew.held'].textures = ['Texture.charged'];
  const errors = validateEntities({ 'resource/attachables/held.json': attachable(), ...assets });
  assert.ok(errors.some((e) => /uses Texture\.charged, which the attachable does not define/.test(e.message)));
});

test('a controller showing or hiding a bone the geometry lacks is rejected', () => {
  const assets = heldAssets();
  assets['resource/render_controllers/held.render_controllers.json'].render_controllers['controller.render.andrew.held'].part_visibility = [{ '*': true }, { string: 'v.loaded' }, { bolt: 'v.loaded' }];
  const errors = validateEntities({ 'resource/attachables/held.json': attachable(), ...assets });
  assert.equal(errors.length, 1, errors.map((e) => e.message).join('\n'));
  assert.match(errors[0].message, /controller\.render\.andrew\.held shows or hides bone bolt, which the attachable's geometry does not have/);
});

test('vanilla attachable ids, controllers and textures are not resolved against this repository', () => {
  const vanilla = attachable({ id: 'minecraft:bow', geometry: 'geometry.bow_standby', animation: 'animation.bow.wield', controller: 'controller.render.bow', texture: 'textures/items/bow_standby' });
  assert.deepStrictEqual(validateEntities({ 'resource/attachables/held.json': vanilla }).map((e) => e.message), []);
});
