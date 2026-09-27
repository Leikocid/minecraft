// npm run build:
//   1. esbuild bundles src/main.ts -> packs/behavior/scripts/main.js
//      (format esm, platform neutral, @minecraft/* stays external — not bundled)
//   2. esbuild bundles src/selftest/main.ts -> packs/selftest/scripts/main.js
//      (the strf test hook is compiled into this one and the gametest bundle,
//      never into the release script)
//   3. compile src/structures/templates -> packs/behavior/structures/andrew/,
//      except the probe templates, which go to packs/gametest/structures/andrew/
//   4. validate both release packs and the selftest pack
//   5. zip packs/behavior and packs/resource into dist/andrew.mcaddon
//
// packs/selftest is built but deliberately NOT zipped: it is a dev-only
// behavior pack that scripts/bds-check.mjs installs on the server alongside the
// release packs. The archive names its two directories explicitly, so the
// selftest pack cannot leak into a release by accident; tests/selftest-pack.
// test.mjs asserts that property on the produced archive.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { validatePacks, validateSelfTestPack } from './validate.mjs';
import { buildPackStructures } from './build-structures.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const behaviorDir = join(root, 'packs', 'behavior');
const resourceDir = join(root, 'packs', 'resource');
const selftestDir = join(root, 'packs', 'selftest');
const packsDir = join(root, 'packs');
const distDir = join(root, 'dist');
const archivePath = join(distDir, 'andrew.mcaddon');

const esbuildBin = join(root, 'node_modules', '.bin', 'esbuild');

/**
 * Bundle the self-check script into packs/selftest/scripts/main.js.
 *
 * Exported so that scripts/bds-check.mjs can rebuild it with the fixture flag
 * on, rather than duplicating the esbuild flags: a fixture run must exercise
 * the *same* bundle as a normal run, or it proves nothing about the real one.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.fixture] - compile in the deliberately-failing check
 * @param {string} [opts.outFile] - override the output path
 */
export function bundleSelfTest({ fixture = false, outFile } = {}) {
  execFileSync(
    esbuildBin,
    [
      join('src', 'selftest', 'main.ts'),
      '--bundle',
      '--format=esm',
      '--platform=neutral',
      '--external:@minecraft/*',
      `--define:__SELFTEST_FIXTURE__=${fixture ? 'true' : 'false'}`,
      `--outfile=${outFile ?? join('packs', 'selftest', 'scripts', 'main.js')}`,
    ],
    { stdio: 'inherit', cwd: root }
  );
}

/**
 * esbuild arguments of the release script, minus the output path. Dropping the
 * STRF_TEST_HOOK label deletes the strf test hook from the release bundle only;
 * tests/structures-registry.test.mjs bundles with these same arguments.
 */
export const RELEASE_BUNDLE_ARGS = [
  join('src', 'main.ts'),
  '--bundle',
  '--format=esm',
  '--platform=neutral',
  '--external:@minecraft/*',
  '--drop-labels=STRF_TEST_HOOK',
];

function step(label, fn) {
  process.stdout.write(`▶ ${label}\n`);
  fn();
  process.stdout.write(`✓ ${label}\n`);
}

function build() {
  step('bundle scripts (esbuild)', () => {
    execFileSync(
      esbuildBin,
      [...RELEASE_BUNDLE_ARGS, `--outfile=${join('packs', 'behavior', 'scripts', 'main.js')}`],
      { stdio: 'inherit', cwd: root }
    );
  });

  step('bundle selftest script (esbuild)', () => {
    bundleSelfTest();
  });

  step('compile structure templates', () => {
    const { release, gametest } = buildPackStructures();
    for (const r of release) process.stdout.write(`  andrew:${r.id} -> ${r.bytes} bytes\n`);
    for (const r of gametest) process.stdout.write(`  andrew:${r.id} -> ${r.bytes} bytes (gametest pack, not released)\n`);
  });

  step('validate packs', () => {
    const errors = [
      ...validatePacks({ behaviorDir, resourceDir, requireScriptEntry: true }),
      ...validateSelfTestPack({ selftestDir, behaviorDir, resourceDir, requireScriptEntry: true }),
    ];
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
    // Only "behavior" and "resource" — "selftest" is dev-only and never ships.
    execFileSync(
      'zip',
      ['-r', '-X', archivePath, 'behavior', 'resource', '-x', '*.DS_Store'],
      { stdio: 'inherit', cwd: packsDir }
    );
  });

  process.stdout.write(`Built ${archivePath}\n`);
}

function isMain() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMain()) {
  build();
}
