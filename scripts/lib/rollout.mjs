// The rollout list, for the build and for the test runners: which products the
// built pack lets a player reach. Its single source is rollout.json at the repo
// root — src/rollout.ts reads the same file, so the script half and the pack
// half can never disagree about what shipped. docs/dev/rollout.md.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const rolloutPath = join(root, 'rollout.json');
/** Where a `files` entry lives in the source tree: the paths are pack-relative, and so are the archive's. */
export const packsDir = join(root, 'packs');

export function loadRollout(file = rolloutPath) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function entries(rollout) {
  return Object.entries(rollout.products ?? {});
}

/**
 * Pack-relative paths the archive must NOT contain: every file of every product
 * that is not rolled out. Order follows rollout.json, so the build's report and
 * the test's expectation read the same way.
 */
export function withheldFiles(rollout) {
  return entries(rollout)
    .filter(([, product]) => product.enabled !== true)
    .flatMap(([, product]) => product.files ?? []);
}

/** Pack-relative paths of the products that ARE rolled out — what the archive must still contain. */
export function shippedFiles(rollout) {
  return entries(rollout)
    .filter(([, product]) => product.enabled === true)
    .flatMap(([, product]) => product.files ?? []);
}

/** Which product withholds a given file, for a report that names the reason and not only the path. */
export function withheldBy(rollout) {
  const map = new Map();
  for (const [id, product] of entries(rollout)) {
    if (product.enabled === true) continue;
    for (const file of product.files ?? []) map.set(file, id);
  }
  return map;
}

/**
 * A path that does not exist withholds nothing and would pass every test silently:
 * a renamed recipe is exactly how a withheld product comes back by accident.
 */
export function missingFiles(rollout, dir = packsDir) {
  return [...withheldFiles(rollout), ...shippedFiles(rollout)].filter((rel) => !existsSync(join(dir, rel)));
}

/**
 * The `zip` arguments that package the two release packs, run from packs/. The
 * withheld files are excluded here rather than deleted from a staging copy, so the
 * archive is built from the real tree and nothing can be left half-removed.
 * Shared with the tests: an argument list the build does not use proves nothing.
 */
export function packageArgs(archivePath, rollout) {
  return ['-r', '-X', archivePath, 'behavior', 'resource', '-x', '*.DS_Store', ...withheldFiles(rollout)];
}
