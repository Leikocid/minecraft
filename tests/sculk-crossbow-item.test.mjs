// Quick Charge shortens the crossbow's use session by 5 ticks a level while the
// native charge still lands on max_draw_duration. A use_duration equal to the
// draw therefore kills every enchanted copy: the session closes at tick 20
// (QC I) or 10 (QC III), before the 25-tick gate, and the next press fires
// nothing — measured on BDS, docs/feedback/probe-crossbow-look.md, addendum.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const item = JSON.parse(readFileSync(join(root, 'packs/behavior/items/sculk_crossbow.json'), 'utf-8'));
const components = item['minecraft:item'].components;

/** Quick Charge takes 5 ticks a level off the session; the enchantment caps at III. */
const QUICK_CHARGE_MAX_TICKS = 15;
const TICKS_PER_SECOND = 20;

test('the Sculk Crossbow still charges with Quick Charge on it', async (t) => {
  await t.test('the use session outlasts the draw by at least Quick Charge III', () => {
    const draw = components['minecraft:shooter'].max_draw_duration;
    const use = components['minecraft:use_modifiers'].use_duration;
    const floor = draw + QUICK_CHARGE_MAX_TICKS / TICKS_PER_SECOND;
    assert.ok(
      use >= floor,
      `use_duration ${use}s must be at least ${floor}s, or a Quick Charge copy never charges`
    );
  });

  await t.test('the charge stays native: charge_on_draw carries the fire-rate gate', () => {
    assert.equal(components['minecraft:shooter'].charge_on_draw, true);
    assert.equal(components['minecraft:shooter'].max_draw_duration, 1.25);
  });
});
