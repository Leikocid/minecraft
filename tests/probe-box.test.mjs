// scripts/build-structures.mjs: src/structures/templates/probe_box.json compiles
// to andrew:probe_box, the disposable measurement box for the stage4-probe
// (strf-p006) engine questions — exact counts only, built through the same
// pipeline as the release structures so this proves what actually ships.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';

function countByName(s) {
  const counts = {};
  for (const i of s.primary) {
    const name = s.palette[i].name;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

test('probe_box: exact fixture counts the strf-p006 probe depends on', () => {
  const out = mkdtempSync(join(tmpdir(), 'andrew-probe-box-'));
  try {
    buildStructures({ to: out });
    const s = parseMcstructure(readFileSync(join(out, 'probe_box.mcstructure')));

    assert.deepStrictEqual(s.size, [9, 5, 7], `size is ${s.size}, expected 9x5x7`);

    const counts = countByName(s);
    assert.strictEqual(counts['minecraft:chest'], 2, `${counts['minecraft:chest']} chests, expected 2`);
    assert.strictEqual(counts['minecraft:mob_spawner'], 1, `${counts['minecraft:mob_spawner']} spawners, expected 1`);
    assert.strictEqual(counts['minecraft:sculk_shrieker'], 1, `${counts['minecraft:sculk_shrieker']} shriekers, expected 1`);
    assert.strictEqual(counts['minecraft:oak_door'], 2, `${counts['minecraft:oak_door']} door blocks, expected 2 (both halves)`);
    assert.strictEqual(counts['minecraft:stone_brick_stairs'], 1, `${counts['minecraft:stone_brick_stairs']} stairs, expected 1`);

    const spawnerEntry = [...s.blockEntities.values()].find((be) => be.id === 'MobSpawner');
    assert.strictEqual(spawnerEntry?.EntityIdentifier, 'minecraft:zombie');

    const shriekerIndex = s.primary.findIndex((i) => s.palette[i].name === 'minecraft:sculk_shrieker');
    assert.strictEqual(s.palette[s.primary[shriekerIndex]].states.can_summon, 1, 'sculk_shrieker can_summon is not true');

    const doorPalette = s.palette.filter((p) => p.name === 'minecraft:oak_door');
    assert.strictEqual(doorPalette.length, 2, 'door needs two distinct permutations, one per half');
    const halves = doorPalette.map((p) => p.states.upper_block_bit).sort();
    assert.deepStrictEqual(halves, [0, 1], 'door halves must be one upper_block_bit=false and one =true');

    const stairsIndex = s.primary.findIndex((i) => s.palette[i].name === 'minecraft:stone_brick_stairs');
    const stairsStates = s.palette[s.primary[stairsIndex]].states;
    assert.strictEqual(typeof stairsStates.weirdo_direction, 'number', 'stairs needs a given weirdo_direction');
    assert.ok([0, 1, 2, 3].includes(stairsStates.weirdo_direction), `weirdo_direction ${stairsStates.weirdo_direction} out of range`);
    assert.strictEqual(stairsStates.upside_down_bit, 0, 'stairs upside_down_bit is not the given orientation');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
