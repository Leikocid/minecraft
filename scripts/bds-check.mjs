// npm run bds:check — prove the built add-on loads on a real Bedrock engine.
//
// Builds dist/andrew.mcaddon, installs both packs into the BDS data directory,
// attaches them to the world, starts the server, reads the log and stops.
//
// The verdict is derived from the log only — see analyzeLog() for the exact
// rules and for why the resource pack is proven by the absence of a warning.
//
//   npm run bds:check
//   npm run bds:check -- --overlay tests/fixtures/bds/broken-dependency
//   npm run bds:check -- --no-build --timeout 120

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BDS_VERSION } from './targets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const composeDir = join(root, 'docker', 'bds');
const composeFile = join(composeDir, 'compose.yaml');
const seedProperties = join(composeDir, 'server.properties');
const dataDir = join(composeDir, 'data');
const addonPath = join(root, 'dist', 'andrew.mcaddon');
const logPath = join(root, 'dist', 'bds-check.log');

// Fixed install names, so a run never depends on leftovers from the last one.
const BP_DIR_NAME = 'andrew_bp';
const RP_DIR_NAME = 'andrew_rp';
const LEVEL_NAME = 'andrew';

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = { build: true, overlay: null, timeoutSec: 300 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-build') opts.build = false;
    else if (arg === '--overlay') opts.overlay = argv[++i];
    else if (arg === '--timeout') opts.timeoutSec = Number(argv[++i]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(opts.timeoutSec) || opts.timeoutSec <= 0) {
    throw new Error('--timeout must be a positive number of seconds');
  }
  return opts;
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function compose(args, opts = {}) {
  return spawnSync('docker', ['compose', '-f', composeFile, ...args], {
    cwd: composeDir,
    encoding: 'utf-8',
    ...opts,
  });
}

// ------------------------------------------------------------ preconditions

function assertComposePinsVersion() {
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

function assertDockerRunning() {
  const res = spawnSync('docker', ['info'], { encoding: 'utf-8', stdio: 'pipe' });
  if (res.status !== 0) {
    throw new Error(
      'the Docker daemon is not reachable — start Docker Desktop and retry.\n' +
        `docker info said: ${(res.stderr || '').trim().split('\n')[0]}`
    );
  }
}

// --------------------------------------------------------------- pack setup

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
function unpackAddon(overlayDir) {
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
 * run's packs and make the check lie.
 */
function stageDataDir({ behavior, resource }) {
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

// ------------------------------------------------------------------ running

function readLog() {
  const res = compose(['logs', '--no-color', '--no-log-prefix']);
  return `${res.stdout ?? ''}${res.stderr ?? ''}`;
}

const SERVER_STARTED = /^\[.*INFO\] Server started\.$/m;
const SCRIPT_LOADED = '[andrew] script loaded';

/**
 * Start the server and wait until it either reports a successful start or
 * dies. Returns the captured log.
 */
function runServer(timeoutSec) {
  const deadline = Date.now() + timeoutSec * 1000;

  log('▶ starting BDS (first run downloads the server — be patient)');
  const up = compose(['up', '-d'], { stdio: 'inherit' });
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

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// ----------------------------------------------------------------- analysis

/**
 * Decide PASS/FAIL from the server log.
 *
 * Behavior pack — proven positively: BDS prints a "Pack Stack" line naming the
 * pack and its uuid.
 *
 * Resource pack — proven negatively, because BDS does not print a stack line
 * for resource packs at world load. It does, however, validate every pack id
 * configured in world_resource_packs.json and warns "Configured pack (id: …)
 * was not found and was ignored" for any it cannot resolve. That detector was
 * verified by deliberately breaking the resource pack uuid: the warning
 * appears when the pack is missing and is absent when it resolves. So a
 * configured id with no such warning means the engine accepted the pack.
 */
function analyzeLog(text, { behavior, resource }) {
  const bpUuid = behavior.manifest.header.uuid;
  const rpUuid = resource.manifest.header.uuid;
  const lines = text.split('\n').map((l) => l.trimEnd());

  const problems = [];
  const evidence = [];

  // --- behavior pack loaded (positive signal)
  const packStack = lines.find(
    (l) => l.includes('Pack Stack') && l.toLowerCase().includes(bpUuid.toLowerCase())
  );
  if (packStack) evidence.push(packStack.trim());
  else problems.push(`behavior pack ${bpUuid} never appeared in a "Pack Stack" line — it was not loaded`);

  // --- neither pack was rejected by the engine (negative signal)
  const ignored = lines.filter((l) => /Configured pack .*was not found and was ignored/i.test(l));
  for (const line of ignored) {
    const lower = line.toLowerCase();
    if (lower.includes(bpUuid.toLowerCase())) problems.push(`behavior pack rejected: ${line.trim()}`);
    else if (lower.includes(rpUuid.toLowerCase())) problems.push(`resource pack rejected: ${line.trim()}`);
  }
  if (!ignored.some((l) => l.toLowerCase().includes(rpUuid.toLowerCase()))) {
    evidence.push(`resource pack ${rpUuid} configured and not rejected by the engine`);
  }

  // --- manifest / dependency / content errors about our packs
  for (const line of lines) {
    if (!/\b(ERROR|WARN)\]/.test(line)) continue;

    // Our own console.warn output is not a problem.
    if (line.includes(SCRIPT_LOADED)) continue;

    if (/Configured pack .*was not found and was ignored/i.test(line)) continue; // handled above

    // Anything the engine complains about that names our namespace or either
    // pack uuid — manifest, dependency and item-schema errors all land here.
    const mentionsOurs =
      /andrew/i.test(line) ||
      line.toLowerCase().includes(bpUuid.toLowerCase()) ||
      line.toLowerCase().includes(rpUuid.toLowerCase());

    // A script engine failure is ours even when the message names no pack.
    const scriptFailure =
      line.includes('[Scripting]') && /error|exception|failed|cannot|unable|not found/i.test(line);

    if (mentionsOurs || scriptFailure) problems.push(line.trim());
  }

  // --- the script actually ran
  const scriptLine = lines.find((l) => l.includes(SCRIPT_LOADED));
  if (scriptLine) evidence.push(scriptLine.trim());
  else problems.push(`"${SCRIPT_LOADED}" is absent from the log — the pack script did not execute`);

  return { problems: [...new Set(problems)], evidence };
}

// --------------------------------------------------------------------- main

function main() {
  const opts = parseArgs(process.argv.slice(2));

  assertComposePinsVersion();
  assertDockerRunning();

  if (opts.build) {
    log('▶ npm run build');
    execFileSync(process.execPath, [join(root, 'scripts', 'build.mjs')], { stdio: 'inherit', cwd: root });
  }
  if (!existsSync(addonPath)) {
    throw new Error(`${addonPath} not found — run "npm run build" first`);
  }

  const packs = unpackAddon(opts.overlay);
  let result;
  try {
    stageDataDir(packs);
    // A previous container would otherwise keep serving its own old log.
    compose(['down']);
    result = runServer(opts.timeoutSec);
  } finally {
    rmSync(packs.tmp, { recursive: true, force: true });
  }

  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(logPath, result.text);
  log(`▶ log saved to ${logPath}`);

  compose(['down'], { stdio: 'inherit' });

  const { problems, evidence } = analyzeLog(result.text, packs);

  if (!result.started) {
    problems.unshift(
      result.exited
        ? 'the BDS container exited before the server started'
        : `the server did not report "Server started." within ${opts.timeoutSec}s`
    );
  }

  log('');
  if (problems.length > 0) {
    log('FAIL — BDS did not load the add-on cleanly:');
    for (const p of problems) log(`  ✗ ${p}`);
    log('');
    log(`Full server log: ${logPath}`);
    process.exit(1);
  }

  log('PASS — BDS loaded the add-on and ran its script:');
  for (const e of evidence) log(`  ✓ ${e}`);
  log('');
  log(`Full server log: ${logPath}`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`bds:check: ${err.message}\n`);
  process.exit(1);
}
