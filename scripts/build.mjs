// npm run build:
//   1. esbuild bundles src/main.ts -> packs/behavior/scripts/main.js
//      (format esm, platform neutral, @minecraft/* stays external — not bundled)
//   2. validate both packs (structural + version-target checks)
//   3. zip packs/behavior and packs/resource into dist/andrew.mcaddon

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validatePacks } from './validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const behaviorDir = join(root, 'packs', 'behavior');
const resourceDir = join(root, 'packs', 'resource');
const packsDir = join(root, 'packs');
const distDir = join(root, 'dist');
const archivePath = join(distDir, 'andrew.mcaddon');

const esbuildBin = join(root, 'node_modules', '.bin', 'esbuild');

function step(label, fn) {
  process.stdout.write(`▶ ${label}\n`);
  fn();
  process.stdout.write(`✓ ${label}\n`);
}

step('bundle scripts (esbuild)', () => {
  execFileSync(
    esbuildBin,
    [
      join('src', 'main.ts'),
      '--bundle',
      '--format=esm',
      '--platform=neutral',
      '--external:@minecraft/*',
      `--outfile=${join('packs', 'behavior', 'scripts', 'main.js')}`,
    ],
    { stdio: 'inherit', cwd: root }
  );
});

step('validate packs', () => {
  const errors = validatePacks({ behaviorDir, resourceDir, requireScriptEntry: true });
  if (errors.length > 0) {
    for (const err of errors) {
      process.stderr.write(`✗ ${err.message}\n`);
    }
    throw new Error(`validate: ${errors.length} error(s)`);
  }
});

step('package .mcaddon', () => {
  mkdirSync(distDir, { recursive: true });
  if (existsSync(archivePath)) {
    rmSync(archivePath);
  }
  execFileSync(
    'zip',
    ['-r', '-X', archivePath, 'behavior', 'resource', '-x', '*.DS_Store'],
    { stdio: 'inherit', cwd: packsDir }
  );
});

process.stdout.write(`Built ${archivePath}\n`);
