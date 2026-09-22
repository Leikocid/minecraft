// Exercises the pure Web Sword rules without the game.
//
// src/websword/rules.ts only ever imports @minecraft/server as a type
// (`import type { GameMode }`), which TypeScript erases at compile time —
// esbuild's bundle below therefore carries no reference to that module at
// all, and no stub plugin is needed (contrast tests/autosmelt.test.mjs,
// which bundles a module that imports @minecraft/server values).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  entryPoints: [join(projectRoot, 'src', 'websword', 'rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});

const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64');

const { craftDecision, cooldownRemaining, parseMark, serializeMark, COOLDOWN_TICKS } =
  await import(moduleUrl);

test('craftDecision — GameMode enum values as strings, as in @minecraft/server 2.x', async (t) => {
  // creative/spectator: always ignore, regardless of flag or mark (Q-015).
  for (const gameMode of ['Creative', 'Spectator']) {
    for (const crafted of [false, true]) {
      for (const marked of [false, true]) {
        await t.test(`${gameMode} crafted=${crafted} marked=${marked} -> ignore`, () => {
          assert.strictEqual(craftDecision({ crafted, gameMode, marked }), 'ignore');
        });
      }
    }
  }

  // survival/adventure + already-marked result: ignore (existing instance, not a new craft).
  for (const gameMode of ['Survival', 'Adventure']) {
    for (const crafted of [false, true]) {
      await t.test(`${gameMode} crafted=${crafted} marked=true -> ignore`, () => {
        assert.strictEqual(craftDecision({ crafted, gameMode, marked: true }), 'ignore');
      });
    }
  }

  // survival/adventure + unmarked + flag not set: first successful craft claims it.
  for (const gameMode of ['Survival', 'Adventure']) {
    await t.test(`${gameMode} crafted=false marked=false -> claim`, () => {
      assert.strictEqual(craftDecision({ crafted: false, gameMode, marked: false }), 'claim');
    });
  }

  // survival/adventure + unmarked + flag already set: blocked, refund (Q-008).
  for (const gameMode of ['Survival', 'Adventure']) {
    await t.test(`${gameMode} crafted=true marked=false -> refund`, () => {
      assert.strictEqual(craftDecision({ crafted: true, gameMode, marked: false }), 'refund');
    });
  }
});

test('cooldownRemaining', async (t) => {
  await t.test('COOLDOWN_TICKS is 30s at 20 ticks/s', () => {
    assert.strictEqual(COOLDOWN_TICKS, 600);
  });

  await t.test('before the end tick: positive remainder', () => {
    assert.strictEqual(cooldownRemaining(100, 700), 600);
  });

  await t.test('on the boundary: zero, not negative', () => {
    assert.strictEqual(cooldownRemaining(700, 700), 0);
  });

  await t.test('after the end tick: clamped to zero, never negative', () => {
    assert.strictEqual(cooldownRemaining(900, 700), 0);
  });

  await t.test('until = 0 (no cooldown ever set) is always expired', () => {
    assert.strictEqual(cooldownRemaining(1, 0), 0);
  });
});

test('parseMark / serializeMark', async (t) => {
  await t.test('round-trips a craft mark with owner name', () => {
    const mark = { origin: 'craft', owner: 'p1', id: '123-abc', ownerName: 'Steve' };
    assert.deepStrictEqual(parseMark(serializeMark(mark)), mark);
  });

  await t.test('round-trips an admin mark with no owner name', () => {
    const mark = { origin: 'admin', owner: 'p2', id: '456-def' };
    assert.deepStrictEqual(parseMark(serializeMark(mark)), mark);
  });

  const garbage = [
    'not json at all',
    '',
    'null',
    '42',
    '"a string"',
    '[]',
    '{}',
    '{"origin":"craft"}',
    '{"origin":"craft","owner":"p1"}',
    '{"origin":"bogus","owner":"p1","id":"x"}',
    '{"origin":"craft","owner":1,"id":"x"}',
    '{"origin":"craft","owner":"p1","id":1}',
    '{"origin":"craft","owner":"p1","id":"x","ownerName":42}',
    '{"origin":null,"owner":"p1","id":"x"}',
  ];

  for (const json of garbage) {
    await t.test(`rejects: ${json || '(empty string)'}`, () => {
      assert.strictEqual(parseMark(json), undefined);
    });
  }
});
