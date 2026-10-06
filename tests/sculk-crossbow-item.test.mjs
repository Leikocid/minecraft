// The crossbow's use session must not outlive its draw. With a use_duration
// longer than max_draw_duration the engine keeps the use open after the item is
// charged: the next tap ends that stale session instead of firing, so a shot
// costs two presses on a touch client. A SimulatedPlayer hides it, because
// stopUsingItem closes the session explicitly.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const item = JSON.parse(readFileSync(join(root, 'packs/behavior/items/sculk_crossbow.json'), 'utf-8'));
const components = item['minecraft:item'].components;

test('the Sculk Crossbow fires on the first press after a charge', async (t) => {
  await t.test('the use session is not longer than the draw', () => {
    const draw = components['minecraft:shooter'].max_draw_duration;
    const use = components['minecraft:use_modifiers'].use_duration;
    assert.equal(typeof draw, 'number');
    assert.equal(
      use,
      draw,
      'use_duration must equal max_draw_duration, or the charged crossbow eats a press'
    );
  });

  await t.test('the charge is still native: charge_on_draw carries the fire-rate gate', () => {
    assert.equal(components['minecraft:shooter'].charge_on_draw, true);
    assert.equal(components['minecraft:shooter'].max_draw_duration, 1.25);
  });
});
