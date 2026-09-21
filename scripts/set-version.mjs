// npm run version:set -- 0.2.1
//
// One command for the add-on version. The iPad treats a pack with the same
// uuid AND the same version as "already imported", so every content change
// that goes to the device needs a bump — and the version lives in six places
// that must agree (tests/manifests.test.mjs and scripts/validate.mjs enforce
// it): package.json, package-lock.json, and header/modules/pack-dependency
// versions in every packs/*/manifest.json. Bumping them by hand was missed
// twice on 2026-09-20; this script is the fix.
//
// Dependencies on script modules (module_name, e.g. @minecraft/server) are
// left alone — those are API versions, not ours.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(arg ?? '')) {
  process.stderr.write('usage: npm run version:set -- <major.minor.patch>\n');
  process.exit(1);
}
const version = arg;
const triple = version.split('.').map(Number);

function rewriteJson(path, mutate) {
  const text = readFileSync(path, 'utf-8');
  const data = JSON.parse(text);
  mutate(data);
  // Keep the file's own indentation style (manifests are 2-space, lock is 2-space).
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  process.stdout.write(`✓ ${path.slice(root.length + 1)}\n`);
}

rewriteJson(join(root, 'package.json'), (p) => {
  p.version = version;
});
rewriteJson(join(root, 'package-lock.json'), (l) => {
  l.version = version;
  if (l.packages && l.packages['']) l.packages[''].version = version;
});

const packsDir = join(root, 'packs');
for (const entry of readdirSync(packsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifestPath = join(packsDir, entry.name, 'manifest.json');
  let exists = true;
  try {
    readFileSync(manifestPath);
  } catch {
    exists = false;
  }
  if (!exists) continue;
  rewriteJson(manifestPath, (m) => {
    m.header.version = triple;
    for (const mod of m.modules ?? []) mod.version = triple;
    for (const dep of m.dependencies ?? []) {
      if (dep.uuid) dep.version = triple; // a pack dependency — ours
    }
  });
}

// Manifests are compact one-line arrays in this repo; JSON.stringify expands
// them. Collapse short numeric arrays back so diffs stay readable.
for (const entry of readdirSync(packsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifestPath = join(packsDir, entry.name, 'manifest.json');
  try {
    const text = readFileSync(manifestPath, 'utf-8').replace(
      /\[\s*(\d+),\s*(\d+),\s*(\d+)\s*\]/g,
      '[$1, $2, $3]'
    );
    writeFileSync(manifestPath, text);
  } catch {
    /* no manifest in this directory */
  }
}

process.stdout.write(`add-on version is now ${version}\n`);
