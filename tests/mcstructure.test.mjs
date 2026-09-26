// scripts/lib/mcstructure.mjs and scripts/build-structures.mjs: a template
// compiled to .mcstructure bytes must parse back to the same size, layers,
// palette and block-entity data.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cellIndex, compileTemplate, parseMcstructure, templateToBuffer } from '../scripts/lib/mcstructure.mjs';
import { buildStructures, listTemplates } from '../scripts/build-structures.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = join(root, 'src', 'structures', 'templates');
const probe = JSON.parse(readFileSync(join(templatesDir, 'probe.json'), 'utf-8'));

const SIZE = [5, 3, 5];
const at = (x, y, z) => cellIndex(SIZE, x, y, z);

test('probe template round-trips through .mcstructure bytes', async (t) => {
  const { buffer } = templateToBuffer(probe);
  const s = parseMcstructure(buffer);
  const blockAt = (x, y, z) => s.palette[s.primary[at(x, y, z)]];

  await t.test('header: format_version, size, origin', () => {
    assert.strictEqual(s.formatVersion, 1);
    assert.deepStrictEqual(s.size, SIZE);
    assert.deepStrictEqual(s.origin, [0, 0, 0]);
  });

  await t.test('both block_indices layers cover the whole volume', () => {
    assert.strictEqual(s.primary.length, 75);
    assert.strictEqual(s.secondary.length, 75);
    assert.ok(s.primary.every((i) => i >= 0 && i < s.palette.length));
  });

  await t.test('palette holds each distinct block once', () => {
    assert.deepStrictEqual(
      s.palette.map((p) => p.name).sort(),
      [
        'minecraft:air',
        'minecraft:chest',
        'minecraft:farmland',
        'minecraft:mob_spawner',
        'minecraft:sculk_shrieker',
        'minecraft:stone_brick_stairs',
        'minecraft:stone_bricks',
        'minecraft:water',
        'minecraft:wheat',
      ]
    );
    assert.ok(s.palette.every((p) => Number.isInteger(p.version) && p.version > 0));
  });

  await t.test('cells sit where the layers put them (x across a row, z down the rows)', () => {
    assert.strictEqual(blockAt(0, 0, 0).name, 'minecraft:stone_bricks');
    assert.strictEqual(blockAt(2, 0, 2).name, 'minecraft:farmland');
    assert.strictEqual(blockAt(0, 1, 0).name, 'minecraft:chest');
    assert.strictEqual(blockAt(2, 1, 0).name, 'minecraft:mob_spawner');
    assert.strictEqual(blockAt(4, 1, 0).name, 'minecraft:sculk_shrieker');
    assert.strictEqual(blockAt(2, 1, 2).name, 'minecraft:wheat');
    assert.strictEqual(blockAt(2, 2, 2).name, 'minecraft:air');
  });

  await t.test('block states keep their NBT types (bool -> byte, int, string)', () => {
    assert.deepStrictEqual(blockAt(4, 1, 0).states, { active: 0, can_summon: 1 });
    assert.deepStrictEqual(blockAt(2, 1, 2).states, { growth: 7 });
    assert.deepStrictEqual(blockAt(0, 1, 0).states, { 'minecraft:cardinal_direction': 'south' });
  });

  await t.test('waterlogging goes to the second layer only', () => {
    const waterlogged = s.secondary.flatMap((p, i) => (p === -1 ? [] : [i]));
    assert.deepStrictEqual(waterlogged, [at(0, 1, 2)]);
    assert.strictEqual(s.palette[s.secondary[at(0, 1, 2)]].name, 'minecraft:water');
    assert.strictEqual(blockAt(0, 1, 2).name, 'minecraft:stone_brick_stairs');
  });

  await t.test('block_entity_data: chest, spawner, shrieker and nothing else', () => {
    assert.deepStrictEqual([...s.blockEntities.keys()].sort((a, b) => a - b), [at(0, 1, 0), at(2, 1, 0), at(4, 1, 0)]);

    const chest = s.blockEntities.get(at(0, 1, 0));
    assert.strictEqual(chest.id, 'Chest');
    assert.deepStrictEqual([chest.x, chest.y, chest.z], [0, 1, 0]);
    assert.deepStrictEqual(
      chest.Items.map((i) => [i.Name, i.Count, i.Slot]),
      [['minecraft:bread', 3, 0], ['minecraft:iron_ingot', 2, 5]]
    );

    const spawner = s.blockEntities.get(at(2, 1, 0));
    assert.strictEqual(spawner.id, 'MobSpawner');
    assert.strictEqual(spawner.EntityIdentifier, 'minecraft:zombie');
    assert.deepStrictEqual([spawner.x, spawner.y, spawner.z], [2, 1, 0]);

    const shrieker = s.blockEntities.get(at(4, 1, 0));
    assert.strictEqual(shrieker.id, 'SculkShrieker');
    assert.deepStrictEqual([shrieker.x, shrieker.y, shrieker.z], [4, 1, 0]);
    // can_summon is a block state, not a block-entity field: the palette carries it.
    assert.strictEqual(s.palette[s.primary[at(4, 1, 0)]].states.can_summon, 1);
  });
});

test('template errors name the problem', () => {
  assert.throws(() => compileTemplate({ size: [2, 1, 2], layers: { 0: ['X'] } }), /unknown block key "X"/);
  assert.throws(() => compileTemplate({ size: [2, 1, 2], layers: { 1: ['.'] } }), /outside/);
  assert.throws(() => compileTemplate({ size: [2, 1, 2], layers: { 0: ['...'] } }), /width is 2/);
  assert.throws(
    () => compileTemplate({ size: [1, 1, 1], blocks: { S: 'minecraft:mob_spawner' }, layers: { 0: ['S'] } }),
    /EntityIdentifier/
  );
});

test('byte budget: a 35x35x30 structure (windmill footprint)', (t) => {
  const template = {
    size: [35, 30, 35],
    blocks: { '#': 'minecraft:stone_bricks', w: { name: 'minecraft:wheat', states: { growth: 7 } } },
    fill: [
      { from: [0, 0, 0], to: [34, 0, 34], block: '#' },
      { from: [0, 1, 0], to: [34, 1, 34], block: 'w' },
    ],
  };
  const { buffer } = templateToBuffer(template);
  t.diagnostic(`35x35x30 .mcstructure: ${buffer.length} bytes uncompressed`);
  // Two int32 layers over 36750 cells, plus headers.
  assert.ok(buffer.length > 36750 * 8 && buffer.length < 36750 * 8 + 4096, `${buffer.length} bytes`);
});

test('buildStructures writes one verified file per template', () => {
  const out = mkdtempSync(join(tmpdir(), 'andrew-structures-'));
  try {
    const results = buildStructures({ to: out });
    const templates = listTemplates().map((t) => t.id);
    assert.ok(templates.includes('windmill'), 'the .ts template is not picked up');
    assert.ok(!templates.includes('windmill-fields') && !templates.includes('probe-big'), 'a helper module is taken for a template');
    assert.deepStrictEqual(results.map((r) => r.id).sort(), templates.sort());
    for (const id of templates) {
      const file = join(out, `${id}.mcstructure`);
      assert.ok(existsSync(file), `${file} written`);
      parseMcstructure(readFileSync(file));
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('structure_void compiles to index -1 with no palette entry, so placing it keeps the terrain', () => {
  const { buffer, counts } = templateToBuffer({
    size: [2, 1, 1],
    blocks: { v: 'minecraft:structure_void', s: 'minecraft:stone' },
    layers: { 0: ['vs'] },
  });
  const s = parseMcstructure(buffer);
  assert.deepStrictEqual(s.primary, [-1, 0]);
  assert.deepStrictEqual(s.palette.map((p) => p.name), ['minecraft:stone']);
  assert.deepStrictEqual(counts, { 'minecraft:structure_void': 1, 'minecraft:stone': 1 });
});
