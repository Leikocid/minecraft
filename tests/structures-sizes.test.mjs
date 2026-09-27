// The size each roll def declares (src/structures/config.ts) against the size
// of the .mcstructure that ships for it: a def smaller than its template leaves
// part of the structure outside the checked and reserved volume.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMcstructure } from '../scripts/lib/mcstructure.mjs';
import { buildStructures } from '../scripts/build-structures.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const bundle = await build({
  stdin: { contents: `export { ROLL_DEFS } from './src/structures/config.ts';`, resolveDir: projectRoot, loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});
const { ROLL_DEFS } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));

const out = mkdtempSync(join(tmpdir(), 'andrew-sizes-'));
buildStructures({ to: out });
/** Roll def id → template file id. */
const TEMPLATE = { windmill: 'windmill', airship: 'airship', warden_city: 'warden-city', bastion: 'bastion' };
const shipped = Object.fromEntries(Object.entries(TEMPLATE).map(([id, file]) => [id, parseMcstructure(readFileSync(join(out, `${file}.mcstructure`))).size]));
rmSync(out, { recursive: true, force: true });

test('every roll def has a shipped template', () => {
  assert.deepStrictEqual(ROLL_DEFS.map((d) => d.id).sort(), Object.keys(TEMPLATE).sort());
});

for (const def of ROLL_DEFS)
  test(`${def.id}: declared size [x, y, z] equals the shipped template size`, () => {
    const got = shipped[def.id];
    const off = ['x', 'y', 'z'].filter((_, i) => def.size[i] !== got[i]);
    assert.deepStrictEqual([...def.size], [...got], `${def.id} declares [${def.size}], the template is [${got}]; off on ${off.join(', ')}`);
  });
