// Structural validation for the two packs: manifests + every JSON under packs/**.
// Each error names the offending file and field — see ValidationError below.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname } from 'node:path';
import { MIN_ENGINE_VERSION, SERVER_API_VERSION } from './targets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ValidationError extends Error {
  constructor(file, field, detail) {
    super(`${file}: ${field}: ${detail}`);
    this.file = file;
    this.field = field;
  }
}

function readJson(path) {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

function listJsonFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listJsonFiles(full));
    } else if (entry.isFile() && extname(entry.name) === '.json') {
      results.push(full);
    }
  }
  return results;
}

function checkUuidV4(file, field, value, errors) {
  if (typeof value !== 'string' || !UUID_V4_REGEX.test(value)) {
    errors.push(new ValidationError(file, field, `must be a valid UUID v4, got ${JSON.stringify(value)}`));
    return null;
  }
  return value.toLowerCase();
}

function checkEqual(file, field, actual, expected, errors) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    errors.push(new ValidationError(file, field, `must equal ${e}, got ${a}`));
  }
}

/**
 * Validate the behavior pack and resource pack directories.
 *
 * @param {object} opts
 * @param {string} opts.behaviorDir - path to packs/behavior
 * @param {string} opts.resourceDir - path to packs/resource
 * @param {boolean} [opts.requireScriptEntry] - also check that the compiled
 *   script entry file exists (only true once, after `npm run build` bundled it)
 * @returns {ValidationError[]} empty array when everything is valid
 */
export function validatePacks({ behaviorDir, resourceDir, requireScriptEntry = false }) {
  const errors = [];

  // 1. Every JSON file under both packs must parse.
  const allJsonFiles = [...listJsonFiles(behaviorDir), ...listJsonFiles(resourceDir)];
  const parsed = new Map();
  for (const file of allJsonFiles) {
    try {
      parsed.set(file, readJson(file));
    } catch (err) {
      errors.push(new ValidationError(file, '<root>', `invalid JSON: ${err.message}`));
    }
  }

  const bpManifestPath = join(behaviorDir, 'manifest.json');
  const rpManifestPath = join(resourceDir, 'manifest.json');

  if (!parsed.has(bpManifestPath) || !parsed.has(rpManifestPath)) {
    if (!parsed.has(bpManifestPath)) {
      errors.push(new ValidationError(bpManifestPath, '<file>', 'manifest.json not found or invalid'));
    }
    if (!parsed.has(rpManifestPath)) {
      errors.push(new ValidationError(rpManifestPath, '<file>', 'manifest.json not found or invalid'));
    }
    return errors;
  }

  const bp = parsed.get(bpManifestPath);
  const rp = parsed.get(rpManifestPath);

  const seenUuids = new Map(); // normalized uuid -> "file:field" of first sighting

  function trackUuid(file, field, uuid) {
    const norm = checkUuidV4(file, field, uuid, errors);
    if (norm === null) return;
    if (seenUuids.has(norm)) {
      errors.push(new ValidationError(file, field, `uuid ${uuid} duplicates ${seenUuids.get(norm)}`));
    } else {
      seenUuids.set(norm, `${file}:${field}`);
    }
  }

  for (const [manifestPath, manifest] of [
    [bpManifestPath, bp],
    [rpManifestPath, rp],
  ]) {
    checkEqual(manifestPath, 'format_version', manifest.format_version, 2, errors);

    if (!manifest.header) {
      errors.push(new ValidationError(manifestPath, 'header', 'missing header'));
      continue;
    }
    trackUuid(manifestPath, 'header.uuid', manifest.header.uuid);
    checkEqual(
      manifestPath,
      'header.min_engine_version',
      manifest.header.min_engine_version,
      MIN_ENGINE_VERSION,
      errors
    );

    for (const [i, mod] of (manifest.modules ?? []).entries()) {
      trackUuid(manifestPath, `modules[${i}].uuid`, mod.uuid);
    }
  }

  // BP must depend on @minecraft/server at exactly the pinned target version.
  const serverDep = (bp.dependencies ?? []).find((d) => d.module_name === '@minecraft/server');
  if (!serverDep) {
    errors.push(
      new ValidationError(bpManifestPath, 'dependencies[@minecraft/server]', 'missing dependency on @minecraft/server')
    );
  } else {
    checkEqual(
      bpManifestPath,
      'dependencies[@minecraft/server].version',
      serverDep.version,
      SERVER_API_VERSION,
      errors
    );
  }

  // BP must reference the actual uuid/version of the resource pack.
  const rpDep = (bp.dependencies ?? []).find((d) => d.uuid && !d.module_name);
  if (!rpDep) {
    errors.push(
      new ValidationError(bpManifestPath, 'dependencies[resource-pack]', 'missing dependency on resource pack')
    );
  } else if (rp.header) {
    if (rpDep.uuid !== rp.header.uuid) {
      errors.push(
        new ValidationError(
          bpManifestPath,
          'dependencies[resource-pack].uuid',
          `must equal resource pack header.uuid ${JSON.stringify(rp.header.uuid)}, got ${JSON.stringify(rpDep.uuid)}`
        )
      );
    }
    if (JSON.stringify(rpDep.version) !== JSON.stringify(rp.header.version)) {
      errors.push(
        new ValidationError(
          bpManifestPath,
          'dependencies[resource-pack].version',
          `must equal resource pack header.version ${JSON.stringify(rp.header.version)}, got ${JSON.stringify(rpDep.version)}`
        )
      );
    }
  }

  // After build, the script module's entry file must exist.
  if (requireScriptEntry) {
    const scriptModule = (bp.modules ?? []).find((m) => m.type === 'script');
    if (!scriptModule) {
      errors.push(new ValidationError(bpManifestPath, 'modules[script]', 'missing script module'));
    } else if (!scriptModule.entry) {
      errors.push(new ValidationError(bpManifestPath, 'modules[script].entry', 'script module has no entry field'));
    } else {
      const entryPath = join(behaviorDir, scriptModule.entry);
      if (!existsSync(entryPath)) {
        errors.push(
          new ValidationError(
            bpManifestPath,
            'modules[script].entry',
            `script entry "${scriptModule.entry}" not found at ${entryPath} — run the build first`
          )
        );
      }
    }
  }

  return errors;
}

function isMain() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMain()) {
  const root = join(__dirname, '..');
  const behaviorDir = join(root, 'packs', 'behavior');
  const resourceDir = join(root, 'packs', 'resource');

  const errors = validatePacks({ behaviorDir, resourceDir, requireScriptEntry: true });

  if (errors.length > 0) {
    for (const err of errors) {
      process.stderr.write(`✗ ${err.message}\n`);
    }
    process.stderr.write(`validate: ${errors.length} error(s)\n`);
    process.exit(1);
  }

  process.stdout.write('validate: ok\n');
}
