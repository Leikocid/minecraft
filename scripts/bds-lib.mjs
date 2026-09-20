// Shared staging logic for the two ways to run BDS against the built add-on:
//
//   scripts/bds-check.mjs  — one-shot automated check (creative, stops itself)
//   scripts/bds-up.mjs     — manual LAN server for the iPad (survival + cheats)
//
// Both need the same "build, unpack, install packs, attach to the world"
// sequence; this module is the one place that sequence is written.

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BDS_VERSION } from './targets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const root = join(__dirname, '..');
export const composeDir = join(root, 'docker', 'bds');
export const composeFile = join(composeDir, 'compose.yaml');
export const seedProperties = join(composeDir, 'server.properties');
export const dataDir = join(composeDir, 'data');
export const addonPath = join(root, 'dist', 'andrew.mcaddon');

// Fixed install names, so a run never depends on leftovers from the last one.
export const BP_DIR_NAME = 'andrew_bp';
export const RP_DIR_NAME = 'andrew_rp';
export const LEVEL_NAME = 'andrew';

export const SERVER_STARTED = /^\[.*INFO\] Server started\.$/m;
export const SCRIPT_LOADED = '[andrew] script loaded';

export function log(msg) {
  process.stdout.write(`${msg}\n`);
}

export function compose(args, opts = {}) {
  return spawnSync('docker', ['compose', '-f', composeFile, ...args], {
    cwd: composeDir,
    encoding: 'utf-8',
    ...opts,
  });
}

export function assertDockerRunning() {
  const res = spawnSync('docker', ['info'], { encoding: 'utf-8', stdio: 'pipe' });
  if (res.status !== 0) {
    throw new Error(
      'the Docker daemon is not reachable — start Docker Desktop and retry.\n' +
        `docker info said: ${(res.stderr || '').trim().split('\n')[0]}`
    );
  }
}

export function assertComposePinsVersion() {
  const text = readFileSync(composeFile, 'utf-8');
  const match = text.match(/^\s*VERSION:\s*"?([0-9.]+)"?\s*$/m);
  if (!match) {
    throw new Error(`${composeFile}: no VERSION found — cannot confirm the BDS version`);
  }
  if (match[1] !== BDS_VERSION) {
    throw new Error(
      `${composeFile}: VERSION is ${match[1]} but scripts/targets.mjs pins BDS_VERSION ${BDS_VERSION} — ` +
        'the docker config and the version targets have drifted apart'
    );
  }
  log(`✓ compose pins BDS ${BDS_VERSION}`);
}

export function buildAddon() {
  log('▶ npm run build');
  execFileSync(process.execPath, [join(root, 'scripts', 'build.mjs')], { stdio: 'inherit', cwd: root });
  if (!existsSync(addonPath)) {
    throw new Error(`${addonPath} not found after build`);
  }
}

/** Classify an unpacked pack directory as behavior or resource from its manifest. */
function classifyPack(manifest) {
  const types = (manifest.modules ?? []).map((m) => m.type);
  if (types.includes('data') || types.includes('script')) return 'behavior';
  if (types.includes('resources')) return 'resource';
  return null;
}

/**
 * Unpack dist/andrew.mcaddon into a temp dir, apply the overlay on top of it,
 * and report where the behavior and resource packs ended up.
 *
 * The overlay is applied *before* the manifests are read, so that a fixture
 * which rewrites a manifest is reflected in world_*_packs.json as well.
 */
export function unpackAddon(overlayDir) {
  const tmp = mkdtempSync(join(tmpdir(), 'andrew-bds-'));
  execFileSync('unzip', ['-q', '-o', addonPath, '-d', tmp]);

  if (overlayDir) {
    const abs = join(root, overlayDir);
    if (!existsSync(abs)) throw new Error(`--overlay directory not found: ${abs}`);
    log(`▶ applying overlay ${overlayDir}`);
    cpSync(abs, tmp, { recursive: true, force: true });
  }

  const found = {};
  for (const entry of readdirSync(tmp, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(tmp, entry.name, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const kind = classifyPack(manifest);
    if (kind) found[kind] = { dir: join(tmp, entry.name), manifest };
  }

  if (!found.behavior) throw new Error(`${addonPath}: no behavior pack found inside the archive`);
  if (!found.resource) throw new Error(`${addonPath}: no resource pack found inside the archive`);
  return { tmp, ...found };
}

/**
 * Install both packs and attach them to the world.
 *
 * The world directory is recreated on every run: world_*_packs.json is written
 * once at world creation, so a stale world would silently keep the previous
 * run's packs and make a check lie.
 */
export function stageDataDir({ behavior, resource }) {
  mkdirSync(dataDir, { recursive: true });

  // The BDS archive is unpacked with `unzip -n`, so this file is never
  // overwritten by the server; the image applies compose env on top of it.
  cpSync(seedProperties, join(dataDir, 'server.properties'), { force: true });

  const bpDest = join(dataDir, 'behavior_packs', BP_DIR_NAME);
  const rpDest = join(dataDir, 'resource_packs', RP_DIR_NAME);
  rmSync(bpDest, { recursive: true, force: true });
  rmSync(rpDest, { recursive: true, force: true });
  mkdirSync(join(dataDir, 'behavior_packs'), { recursive: true });
  mkdirSync(join(dataDir, 'resource_packs'), { recursive: true });
  cpSync(behavior.dir, bpDest, { recursive: true });
  cpSync(resource.dir, rpDest, { recursive: true });

  const worldDir = join(dataDir, 'worlds', LEVEL_NAME);
  rmSync(worldDir, { recursive: true, force: true });
  mkdirSync(worldDir, { recursive: true });

  const entry = (m) => [{ pack_id: m.header.uuid, version: m.header.version }];
  writeFileSync(join(worldDir, 'world_behavior_packs.json'), JSON.stringify(entry(behavior.manifest)));
  writeFileSync(join(worldDir, 'world_resource_packs.json'), JSON.stringify(entry(resource.manifest)));

  // Old content logs would otherwise be mistaken for this run's output.
  for (const f of readdirSync(dataDir)) {
    if (f.startsWith('ContentLog')) rmSync(join(dataDir, f), { force: true });
  }

  log(`✓ installed ${behavior.manifest.header.name} -> behavior_packs/${BP_DIR_NAME}`);
  log(`✓ installed ${resource.manifest.header.name} -> resource_packs/${RP_DIR_NAME}`);
}

/**
 * Apply key=value overrides to an already-staged server.properties, replacing
 * an existing `key=...` line in place or appending the key if absent.
 */
export function applyPropertyOverrides(overrides) {
  const path = join(dataDir, 'server.properties');
  const lines = readFileSync(path, 'utf-8').split('\n');
  const remaining = new Map(Object.entries(overrides));

  const out = lines.map((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+)=/);
    if (!match) return line;
    const key = match[1];
    if (!remaining.has(key)) return line;
    const value = remaining.get(key);
    remaining.delete(key);
    return `${key}=${value}`;
  });

  for (const [key, value] of remaining) {
    out.push(`${key}=${value}`);
  }

  writeFileSync(path, out.join('\n'));
}

export function readLog() {
  const res = compose(['logs', '--no-color', '--no-log-prefix']);
  return `${res.stdout ?? ''}${res.stderr ?? ''}`;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Start the server and wait until it either reports a successful start or
 * dies. Returns the captured log.
 *
 * `envOverrides` is merged into the environment of `docker compose up` —
 * this is how the caller reaches `${VAR:-default}` substitutions in
 * compose.yaml (e.g. BDS_GAMEMODE). Writing straight into server.properties
 * is not enough for keys the image manages via env (like gamemode): the
 * entrypoint reapplies them from the environment on every container start.
 */
export function runServer(timeoutSec, envOverrides = {}) {
  const deadline = Date.now() + timeoutSec * 1000;

  log('▶ starting BDS (first run downloads the server — be patient)');
  const up = compose(['up', '-d'], { stdio: 'inherit', env: { ...process.env, ...envOverrides } });
  if (up.status !== 0) throw new Error('docker compose up failed');

  let text = '';
  let started = false;
  while (Date.now() < deadline) {
    text = readLog();
    if (SERVER_STARTED.test(text)) {
      started = true;
      break;
    }
    const ps = compose(['ps', '-q', '--status', 'running']);
    if ((ps.stdout ?? '').trim() === '') {
      // Container exited before reporting a start — the log holds the reason.
      return { text: readLog(), started: false, exited: true };
    }
    sleep(3000);
  }

  if (started) {
    // Scripts are evaluated just after the start line; give them a moment so
    // that a missing "script loaded" means "did not run", not "not yet".
    const scriptDeadline = Math.min(Date.now() + 30_000, deadline);
    while (Date.now() < scriptDeadline) {
      text = readLog();
      if (text.includes(SCRIPT_LOADED)) break;
      sleep(2000);
    }
  }

  return { text, started, exited: false };
}
