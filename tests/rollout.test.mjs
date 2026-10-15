// The rollout list (rollout.json, docs/dev/rollout.md): what the built pack lets a
// player reach. A withheld product keeps every line of its code and every one of its
// tests — only the files named here are left out of dist/andrew.mcaddon.
//
// What these tests hold in place: the list is honest (its paths exist, nothing is
// claimed twice), both halves read the same file (scripts/lib/rollout.mjs for the
// build, src/rollout.ts for the pack), a listed registration cannot be called
// unguarded in src/main.ts, and the packaging really withholds — proven in both
// directions against a fixture where the same product is on.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRollout, missingFiles, packageArgs, packsDir, shippedFiles, withheldBy, withheldFiles } from '../scripts/lib/rollout.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rollout = loadRollout();
const products = Object.entries(rollout.products);
const listing = (archive) => execFileSync('unzip', ['-Z1', archive], { encoding: 'utf-8' }).split('\n').filter(Boolean);

// ------------------------------------------------------------------ the list

test('every product declares enabled, stage, note, files and registrations', () => {
  assert.ok(products.length > 0, 'rollout.json has no products');
  for (const [id, product] of products) {
    assert.equal(typeof product.enabled, 'boolean', `${id}.enabled`);
    // The queue the operator set on 15.10 — 0 went out with the release, then one
    // part at a time. In the file rather than in a chat message, which evaporates.
    assert.ok(Number.isInteger(product.stage) && product.stage >= 0, `${id}.stage is not a part number`);
    assert.ok(typeof product.note === 'string' && product.note.length > 20, `${id}.note explains nothing`);
    assert.ok(Array.isArray(product.files), `${id}.files`);
    assert.ok(Array.isArray(product.registrations), `${id}.registrations`);
  }
});

// A later stage must not quietly precede an earlier one: that is the operator's order,
// not an implementation detail.
test('the rolled-out stages are a prefix of the queue', () => {
  const byStage = new Map();
  for (const [, product] of products) {
    const seen = byStage.get(product.stage);
    assert.ok(seen === undefined || seen === product.enabled, `stage ${product.stage} is half rolled out`);
    byStage.set(product.stage, product.enabled);
  }
  const stages = [...byStage.keys()].sort((a, b) => a - b);
  let closed = false;
  for (const stage of stages) {
    if (!byStage.get(stage)) closed = true;
    else assert.ok(!closed, `stage ${stage} is rolled out while an earlier stage is still withheld`);
  }
});

// The release-pack scenario decides what to expect from the list itself; a product the
// list knows and the scenario does not would never be crafted, and its zero would be
// read as proof.
test('the release-pack scenario covers every product in the list', () => {
  const scenario = readFileSync(join(root, 'src', 'gametest', 'rollout.ts'), 'utf-8');
  assert.match(scenario, /import \{[^}]*isRolledOut[^}]*\} from "\.\.\/rollout"/, 'the scenario does not ask the list');
  for (const [id] of products) {
    assert.ok(scenario.includes(`id: "${id}"`), `${id} is in rollout.json but not in the scenario's PRODUCTS`);
  }
});

test('no file is claimed by two products, and every path is pack-relative', () => {
  const seen = new Map();
  for (const [id, product] of products) {
    for (const file of product.files) {
      assert.ok(!file.startsWith('/') && !file.startsWith('packs/'), `${id}: ${file} is not pack-relative`);
      assert.ok(file.startsWith('behavior/') || file.startsWith('resource/'), `${id}: ${file} is in neither pack`);
      const other = seen.get(file);
      assert.equal(other, undefined, `${file} is claimed by both ${other} and ${id}`);
      seen.set(file, id);
    }
  }
});

// A path that matches nothing withholds nothing and reads as success, which is how a
// withheld product comes back after a rename without anybody deciding to.
test('rollout.json names only files that exist under packs/', () => {
  assert.deepEqual(missingFiles(rollout), []);
});

test('withheldFiles and shippedFiles split the list by enabled', () => {
  for (const [id, product] of products) {
    const where = product.enabled ? shippedFiles(rollout) : withheldFiles(rollout);
    const notThere = product.enabled ? withheldFiles(rollout) : shippedFiles(rollout);
    for (const file of product.files) {
      assert.ok(where.includes(file), `${id}: ${file} missing from the ${product.enabled ? 'shipped' : 'withheld'} set`);
      assert.ok(!notThere.includes(file), `${id}: ${file} is in both sets`);
    }
  }
  for (const [file, id] of withheldBy(rollout)) {
    assert.equal(rollout.products[id].enabled, false, `${file} is withheld by ${id}, which is enabled`);
  }
});

test('negative control: with every product on, nothing is withheld', () => {
  const allOn = { products: Object.fromEntries(products.map(([id, p]) => [id, { ...p, enabled: true }])) };
  assert.deepEqual(withheldFiles(allOn), []);
  assert.deepEqual(shippedFiles(allOn).sort(), products.flatMap(([, p]) => p.files).sort());
});

// ------------------------------------------------------- the pack's own half

test('src/rollout.ts answers out of the same file', async () => {
  const bundle = await build({
    entryPoints: [join(root, 'src', 'rollout.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    external: ['@minecraft/*'],
  });
  const { isRolledOut } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf-8').toString('base64'));
  for (const [id, product] of products) {
    assert.equal(isRolledOut(id), product.enabled, `isRolledOut(${id})`);
  }
});

/** Call name -> the gate ids it was seen under; `null` stands for an ungated call. */
function callsIn(source) {
  const seen = new Map();
  const record = (name, gate) => seen.set(name, [...(seen.get(name) ?? []), gate]);
  const gates = [];
  let depth = 0;
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    const block = line.match(/^if \(isRolledOut\("([^"]+)"\)\) \{$/);
    const inline = line.match(/^if \(isRolledOut\("([^"]+)"\)\) (\w+)\(/);
    if (inline) record(inline[2], inline[1]);
    else if (!block) {
      for (const m of line.matchAll(/(?:^|[^.\w])(register\w+)\(/g)) record(m[1], gates.at(-1)?.id ?? null);
    }
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    if (block) gates.push({ id: block[1], depth });
    else while (gates.length > 0 && gates.at(-1).depth > depth) gates.pop();
  }
  return seen;
}

test('every registration the list names is called in src/main.ts only under its own gate', () => {
  const calls = callsIn(readFileSync(join(root, 'src', 'main.ts'), 'utf-8'));
  // The scanner itself has to be right: main.ts calls plenty of registrations that no
  // product gates, and reading them as gated would make this test pass on anything.
  assert.deepEqual(calls.get('registerCraftGate'), [null], 'the scanner read an ungated call as gated');
  for (const [id, product] of products) {
    for (const name of product.registrations) {
      const gates = calls.get(name);
      assert.ok(gates !== undefined, `${id}: ${name}() is in rollout.json but not in src/main.ts`);
      assert.deepEqual(gates, gates.map(() => id), `${id}: ${name}() is called under ${gates.map((g) => g ?? 'no gate').join(', ')}`);
    }
  }
});

// ------------------------------------------------------------- the packaging

test('dist/andrew.mcaddon holds every rolled-out file and none of the withheld ones', (t) => {
  const archive = join(root, 'dist', 'andrew.mcaddon');
  if (!existsSync(archive)) {
    t.skip(`${archive} not built yet — run "npm run build" first`);
    return;
  }
  const files = listing(archive);
  for (const rel of withheldFiles(rollout)) assert.ok(!files.includes(rel), `${rel} is in the release archive`);
  for (const rel of shippedFiles(rollout)) assert.ok(files.includes(rel), `${rel} is missing from the release archive`);
  // An archive that withholds everything would also pass the loop above.
  assert.equal(files.filter((f) => f.endsWith('.mcstructure')).length, 4, 'the four structures');
  assert.ok(files.includes('behavior/scripts/main.js') && files.includes('behavior/manifest.json'), 'the behavior pack');
});

test('the packaging withholds, and keeps the same file when the product is on', (t) => {
  // Whatever is withheld right now — naming a product here would turn the control into
  // a thing to repair on the day that product is rolled out.
  const target = withheldFiles(rollout)[0];
  if (target === undefined) {
    t.skip('the whole list is rolled out — nothing to withhold');
    return;
  }
  const dir = mkdtempSync(join(tmpdir(), 'andrew-rollout-'));
  try {
    const withheldZip = join(dir, 'withheld.zip');
    execFileSync('zip', ['-q', ...packageArgs(withheldZip, rollout)], { cwd: packsDir });
    assert.ok(!listing(withheldZip).includes(target), `${target} survived the real rollout list`);

    const allOn = { products: Object.fromEntries(products.map(([id, p]) => [id, { ...p, enabled: true }])) };
    const fullZip = join(dir, 'full.zip');
    execFileSync('zip', ['-q', ...packageArgs(fullZip, allOn)], { cwd: packsDir });
    assert.ok(listing(fullZip).includes(target), `${target} is absent even with its product on — the exclusion is not what removed it`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
