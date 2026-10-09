import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { BROAD_TESTS } from '../scripts/lib/suite-broad.mjs';

// bds-gametest.mjs resolves its BDS instance at import time and refuses to run
// against production, so the suite list is read as text rather than imported.
const runner = readFileSync(fileURLToPath(new URL('../scripts/bds-gametest.mjs', import.meta.url)), 'utf-8');
const expected = runner
  .slice(runner.indexOf('const EXPECTED_TESTS = ['), runner.indexOf('const notInSuite'))
  .match(/'andrew:[a-z0-9_]+'/g)
  .map((q) => q.slice(1, -1));

test('the suite list parses', () => {
  assert.ok(expected.length > 300, `read ${expected.length} scenarios from EXPECTED_TESTS`);
});

test('every broad scenario exists in the suite', () => {
  const missing = BROAD_TESTS.filter((name) => !expected.includes(name));
  assert.deepEqual(missing, []);
});

test('the broad set stays small and has no repeats', () => {
  assert.ok(BROAD_TESTS.length >= 10 && BROAD_TESTS.length <= 20, `${BROAD_TESTS.length} scenarios`);
  assert.equal(new Set(BROAD_TESTS).size, BROAD_TESTS.length);
});

test('the broad set holds no probe and no restart half', () => {
  // A probe measures the engine, not the product; a restart half stops and
  // starts BDS, which is what makes the deep run slow.
  const probes = BROAD_TESTS.filter((name) => name.includes(':probe_') || name.includes('_probe_'));
  assert.deepEqual(probes, []);
  const restarts = BROAD_TESTS.filter((name) => name.includes('_restart_'));
  assert.deepEqual(restarts, []);
});

test('every shipped system is represented', () => {
  // Each entry is a system a player can see fail. Removing the last scenario of
  // one would leave it unchecked at release, which is what this pins.
  const systems = {
    pickaxe: /pickaxe_/,
    'web sword': /websword_/,
    'legendary framework': /^andrew:legendary_/,
    scythe: /scythe_/,
    katana: /katana_/,
    'cannon, left press': /pntr_/,
    'cannon, right press': /ring_/,
    ufo: /ufo_saucer_|ufo_arrival_/,
    magnet: /ufo_magnet_|ufo_hold_/,
    'sculk crossbow': /sculk_/,
    'storm blade, active': /storm_active_/,
    'storm blade, passive': /storm_passive_/,
    'vanilla recipes': /vanilla_recipe_/,
    structures: /strf_/,
  };
  const uncovered = Object.entries(systems)
    .filter(([, re]) => !BROAD_TESTS.some((name) => re.test(name)))
    .map(([label]) => label);
  assert.deepEqual(uncovered, []);
});
