// npm run bds:gametest — drive the Miner's Pickaxe through a SimulatedPlayer
// on a real Bedrock engine, with no human and no iPad.
//
// This is the beta-only lane. @minecraft/server-gametest has no stable channel,
// so the pack that uses it (packs/gametest) needs the "Beta APIs" experiment on
// the world. Neither the experiment nor the beta module ever touches the
// product: the release packs stay on stable @minecraft/server 2.10.0, the
// archive never contains packs/gametest, and this runner uses its own world
// (LEVEL_NAME=gametest) so the "andrew" world that bds:check and bds:up use is
// left alone. [src: concept-constraint C-2]
//
// Why it is not a one-liner — three things BDS gives no supported hook for, all
// solved here and documented in docs/dev/gametest-on-bds.md:
//
//   1. Experiments. There is no server.properties key and no env var. The flag
//      lives in the world's level.dat, which only exists after the world has
//      been generated. So the server is booted once to create the world, the
//      level.dat NBT is patched, and the server is booted again.
//   2. Structures. register() refuses to run without
//      structures/<class>/<name>.mcstructure in the behavior pack, so the
//      platform the test runs on is generated here rather than committed as a
//      binary blob.
//   3. The console. The image's own `send-command` finds the server process by
//      its /proc exe symlink, which under Rosetta points at the emulator for
//      every process — so it never matches. The process is found by cmdline
//      instead and the command is written to its stdin.
//
//   npm run bds:gametest
//   npm run bds:gametest -- --no-build --timeout 600
//   npm run bds:gametest -- --keep-up      # leave the server running to inspect

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  addonPath,
  assertComposePinsVersion,
  assertDockerRunning,
  buildAddon,
  compose,
  dataDir,
  log,
  root,
  seedProperties,
  unpackAddon,
} from './bds-lib.mjs';
import { MIN_ENGINE_VERSION } from './targets.mjs';

// A world of its own: the everyday "andrew" world must never carry the
// experiment flag, and this one is wiped on every run.
const LEVEL_NAME = 'gametest';

const BP_DIR_NAME = 'andrew_bp';
const RP_DIR_NAME = 'andrew_rp';
const GT_DIR_NAME = 'andrew_gametest';

const gametestDir = join(root, 'packs', 'gametest');
const worldDir = join(dataDir, 'worlds', LEVEL_NAME);
const logPath = join(root, 'dist', 'bds-gametest.log');

const SERVER_STARTED = /^\[.*INFO\] Server started\.$/m;
const SCRIPT_LOADED = '[gametest] script loaded';
const EXPERIMENT_ACTIVE = 'Experiment(s) active:';

/**
 * Tests registered by src/gametest/main.ts, run one at a time.
 *
 * Not `/gametest runset`: that starts every test in the batch at once and lays
 * their structures out side by side, so only the first sits at the console's
 * own origin. Run singly (with a `clearall` between), every test gets that same
 * origin, which keeps placement identical from test to test and from run to run.
 *
 * An earlier note here blamed runset for "Could not setBlock 'stone'", on the
 * theory that the off-origin structures fell outside the ticking area. That was
 * wrong: the real cause was setBlockType failing when the call would not change
 * the block — see placeBlock() in src/gametest/main.ts.
 */
const EXPECTED_TESTS = [
  'andrew:pickaxe_digs_at_diamond_speed',
  'andrew:pickaxe_autosmelt',
  'andrew:pickaxe_keeps_vanilla_drops',
  'andrew:websword_first_claim',
  'andrew:websword_second_refund',
  'andrew:websword_creative_ignored',
  'andrew:websword_death_returns',
  'andrew:websword_unmarked_drops',
  'andrew:websword_cube_placed',
  'andrew:websword_protected_skipped',
  'andrew:websword_out_of_reach_noop',
  'andrew:websword_cooldown_blocks_reuse',
];

// FLAT is not cosmetic: see the LEVEL_TYPE comment in docker/bds/compose.yaml.
// A default world put the platform under an ocean and the run was intermittent.
const env = {
  ...process.env,
  BDS_LEVEL_NAME: LEVEL_NAME,
  BDS_GAMEMODE: 'survival',
  BDS_LEVEL_TYPE: 'FLAT',
};

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = { build: true, timeoutSec: 600, keepUp: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-build') opts.build = false;
    else if (arg === '--keep-up') opts.keepUp = true;
    else if (arg === '--timeout') opts.timeoutSec = Number(argv[++i]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(opts.timeoutSec) || opts.timeoutSec <= 0) {
    throw new Error('--timeout must be a positive number of seconds');
  }
  return opts;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// -------------------------------------------------------- little-endian NBT
//
// Bedrock writes NBT little-endian. Both files this script has to produce are
// NBT: level.dat (with an 8-byte header: format version, payload length) and
// .mcstructure (bare, no header).
//
// Tags are kept as { type, name, value } rather than plain objects so that a
// parse -> edit -> serialise round trip preserves types exactly. level.dat is
// written by the engine and read back by it; guessing a type would corrupt a
// field this script never meant to touch.

const TAG_END = 0;
const TAG_BYTE = 1;
const TAG_INT = 3;
const TAG_STRING = 8;
const TAG_LIST = 9;
const TAG_COMPOUND = 10;

function readNbt(buf, start) {
  let off = start;

  const readString = () => {
    const len = buf.readUInt16LE(off);
    off += 2;
    const s = buf.toString('utf8', off, off + len);
    off += len;
    return s;
  };

  const readPayload = (type) => {
    switch (type) {
      case TAG_BYTE: return buf.readInt8(off++);
      case 2: { const v = buf.readInt16LE(off); off += 2; return v; }
      case TAG_INT: { const v = buf.readInt32LE(off); off += 4; return v; }
      case 4: { const v = buf.readBigInt64LE(off); off += 8; return v; }
      case 5: { const v = buf.readFloatLE(off); off += 4; return v; }
      case 6: { const v = buf.readDoubleLE(off); off += 8; return v; }
      case 7: { const n = buf.readInt32LE(off); off += 4; const v = Buffer.from(buf.subarray(off, off + n)); off += n; return v; }
      case TAG_STRING: return readString();
      case TAG_LIST: {
        const elementType = buf.readUInt8(off++);
        const n = buf.readInt32LE(off);
        off += 4;
        const items = [];
        for (let i = 0; i < n; i++) items.push(readPayload(elementType));
        return { elementType, items };
      }
      case TAG_COMPOUND: {
        const entries = [];
        for (;;) {
          const type2 = buf.readUInt8(off++);
          if (type2 === TAG_END) break;
          entries.push({ type: type2, name: readString(), value: readPayload(type2) });
        }
        return entries;
      }
      case 11: {
        const n = buf.readInt32LE(off);
        off += 4;
        const items = [];
        for (let i = 0; i < n; i++) { items.push(buf.readInt32LE(off)); off += 4; }
        return items;
      }
      default: throw new Error(`unsupported NBT tag ${type} at offset ${off}`);
    }
  };

  const type = buf.readUInt8(off++);
  const name = readString();
  const value = readPayload(type);
  return { tag: { type, name, value }, end: off };
}

function writeNbt(tag) {
  const chunks = [];

  const writeString = (s) => {
    const b = Buffer.from(s, 'utf8');
    const h = Buffer.alloc(2);
    h.writeUInt16LE(b.length);
    chunks.push(h, b);
  };

  const writePayload = (type, value) => {
    switch (type) {
      case TAG_BYTE: { const b = Buffer.alloc(1); b.writeInt8(value); chunks.push(b); break; }
      case 2: { const b = Buffer.alloc(2); b.writeInt16LE(value); chunks.push(b); break; }
      case TAG_INT: { const b = Buffer.alloc(4); b.writeInt32LE(value); chunks.push(b); break; }
      case 4: { const b = Buffer.alloc(8); b.writeBigInt64LE(value); chunks.push(b); break; }
      case 5: { const b = Buffer.alloc(4); b.writeFloatLE(value); chunks.push(b); break; }
      case 6: { const b = Buffer.alloc(8); b.writeDoubleLE(value); chunks.push(b); break; }
      case 7: { const h = Buffer.alloc(4); h.writeInt32LE(value.length); chunks.push(h, value); break; }
      case TAG_STRING: writeString(value); break;
      case TAG_LIST: {
        const h = Buffer.alloc(5);
        h.writeUInt8(value.elementType, 0);
        h.writeInt32LE(value.items.length, 1);
        chunks.push(h);
        for (const item of value.items) writePayload(value.elementType, item);
        break;
      }
      case TAG_COMPOUND: {
        for (const entry of value) {
          chunks.push(Buffer.from([entry.type]));
          writeString(entry.name);
          writePayload(entry.type, entry.value);
        }
        chunks.push(Buffer.from([TAG_END]));
        break;
      }
      case 11: {
        const h = Buffer.alloc(4); h.writeInt32LE(value.length); chunks.push(h);
        for (const v of value) { const b = Buffer.alloc(4); b.writeInt32LE(v); chunks.push(b); }
        break;
      }
      default: throw new Error(`unsupported NBT tag ${type}`);
    }
  };

  chunks.push(Buffer.from([tag.type]));
  writeString(tag.name);
  writePayload(tag.type, tag.value);
  return Buffer.concat(chunks);
}

// ------------------------------------------------------- experiments toggle

/**
 * Turn on "Beta APIs" for the gametest world by editing its level.dat.
 *
 * `gametest` is the internal key the engine has always used for that toggle —
 * the UI label changed from "GameTest Framework" to "Beta APIs", the NBT key
 * did not. The two bookkeeping flags next to it are what the engine sets when a
 * world is saved with any experiment on; without them the world is not treated
 * as experimental. The engine confirms the result in the log on the next start:
 *   [INFO] Experiment(s) active: gtst
 */
function enableBetaApis() {
  const path = join(worldDir, 'level.dat');
  if (!existsSync(path)) throw new Error(`${path} not found — the world was not generated`);

  const buf = readFileSync(path);
  const { tag, end } = readNbt(buf, 8);
  if (end !== buf.length) {
    // A short read means the parser disagrees with the engine about the format;
    // writing back from a partial parse would silently truncate the world.
    throw new Error(`${path}: parsed ${end} of ${buf.length} bytes — refusing to rewrite it`);
  }

  const experiments = tag.value.find((e) => e.name === 'experiments');
  if (experiments === undefined) throw new Error(`${path}: no "experiments" compound`);

  for (const name of ['gametest', 'experiments_ever_used', 'saved_with_toggled_experiments']) {
    const found = experiments.value.find((e) => e.name === name);
    if (found) found.value = 1;
    else experiments.value.push({ type: TAG_BYTE, name, value: 1 });
  }

  const body = writeNbt(tag);
  const header = Buffer.alloc(8);
  header.writeInt32LE(buf.readInt32LE(0), 0); // keep the engine's format version
  header.writeInt32LE(body.length, 4);
  writeFileSync(path, Buffer.concat([header, body]));
  log(`✓ level.dat: Beta APIs experiment enabled (${buf.length} -> ${body.length + 8} bytes)`);
}

// ---------------------------------------------------------------- structure

/**
 * Write the platform every test runs on.
 *
 * Generated rather than committed: a .mcstructure is opaque binary, and a
 * committed one could drift from the coordinates src/gametest/main.ts uses
 * without anything noticing. A stone floor at y=0 and air above it is the whole
 * design — the tests build what they need with setBlockType.
 */
function writeStructure({ sx, sy, sz }) {
  // Block "version" is the game version packed one byte per component.
  const [major, minor, patch] = MIN_ENGINE_VERSION;
  const blockVersion = (major << 24) | (minor << 16) | (patch << 8);

  const paletteEntry = (name) => [
    { type: TAG_STRING, name: 'name', value: name },
    { type: TAG_COMPOUND, name: 'states', value: [] },
    { type: TAG_INT, name: 'version', value: blockVersion },
  ];

  const AIR = 0;
  const STONE = 1;
  const primary = [];
  for (let x = 0; x < sx; x++) {
    for (let y = 0; y < sy; y++) {
      for (let z = 0; z < sz; z++) {
        primary.push(y === 0 ? STONE : AIR);
      }
    }
  }
  // -1 means "no block" in the second layer; it exists only for waterlogging.
  const secondary = new Array(primary.length).fill(-1);

  const tag = {
    type: TAG_COMPOUND,
    name: '',
    value: [
      { type: TAG_INT, name: 'format_version', value: 1 },
      { type: TAG_LIST, name: 'size', value: { elementType: TAG_INT, items: [sx, sy, sz] } },
      {
        type: TAG_COMPOUND,
        name: 'structure',
        value: [
          {
            type: TAG_LIST,
            name: 'block_indices',
            value: {
              elementType: TAG_LIST,
              items: [
                { elementType: TAG_INT, items: primary },
                { elementType: TAG_INT, items: secondary },
              ],
            },
          },
          { type: TAG_LIST, name: 'entities', value: { elementType: TAG_COMPOUND, items: [] } },
          {
            type: TAG_COMPOUND,
            name: 'palette',
            value: [
              {
                type: TAG_COMPOUND,
                name: 'default',
                value: [
                  {
                    type: TAG_LIST,
                    name: 'block_palette',
                    value: {
                      elementType: TAG_COMPOUND,
                      items: [paletteEntry('minecraft:air'), paletteEntry('minecraft:stone')],
                    },
                  },
                  { type: TAG_COMPOUND, name: 'block_position_data', value: [] },
                ],
              },
            ],
          },
        ],
      },
      {
        type: TAG_LIST,
        name: 'structure_world_origin',
        value: { elementType: TAG_INT, items: [0, 0, 0] },
      },
    ],
  };

  const dir = join(gametestDir, 'structures', 'andrew');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'platform.mcstructure');
  writeFileSync(path, writeNbt(tag));
  log(`✓ generated ${sx}x${sy}x${sz} platform -> packs/gametest/structures/andrew/platform.mcstructure`);
}

// ------------------------------------------------------------------ staging

function bundleGameTestScript() {
  log('▶ bundle gametest script (esbuild)');
  execFileSync(
    join(root, 'node_modules', '.bin', 'esbuild'),
    [
      join('src', 'gametest', 'main.ts'),
      '--bundle',
      '--format=esm',
      '--platform=neutral',
      '--external:@minecraft/*',
      `--outfile=${join('packs', 'gametest', 'scripts', 'main.js')}`,
    ],
    { stdio: 'inherit', cwd: root }
  );
}

/** Install the two release packs plus the dev-only gametest pack. */
function installPacks({ behavior, resource }) {
  const gametest = {
    dir: gametestDir,
    manifest: JSON.parse(readFileSync(join(gametestDir, 'manifest.json'), 'utf-8')),
  };

  for (const [kind, dirName, src] of [
    ['behavior_packs', BP_DIR_NAME, behavior.dir],
    ['resource_packs', RP_DIR_NAME, resource.dir],
    ['behavior_packs', GT_DIR_NAME, gametest.dir],
  ]) {
    const dest = join(dataDir, kind, dirName);
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(join(dataDir, kind), { recursive: true });
    cpSync(src, dest, { recursive: true });
  }

  const entry = (m) => ({ pack_id: m.header.uuid, version: m.header.version });
  // The release pack first: the gametest pack depends on it by manifest, and
  // the scenarios need andrew:miners_pickaxe to already exist.
  writeFileSync(
    join(worldDir, 'world_behavior_packs.json'),
    JSON.stringify([entry(behavior.manifest), entry(gametest.manifest)])
  );
  writeFileSync(join(worldDir, 'world_resource_packs.json'), JSON.stringify([entry(resource.manifest)]));

  log(`✓ installed ${behavior.manifest.header.name}, ${resource.manifest.header.name}, ${gametest.manifest.header.name}`);
  return gametest;
}

// ------------------------------------------------------------------- server

function readLog() {
  const res = compose(['logs', '--no-color', '--no-log-prefix']);
  return `${res.stdout ?? ''}${res.stderr ?? ''}`;
}

function up() {
  const res = compose(['up', '-d'], { stdio: 'inherit', env });
  if (res.status !== 0) throw new Error('docker compose up failed');
}

/** Wait until the log satisfies `done`, or the deadline passes. */
function waitFor(label, done, deadline) {
  for (;;) {
    const text = readLog();
    if (done(text)) return text;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    const ps = compose(['ps', '-q', '--status', 'running']);
    if ((ps.stdout ?? '').trim() === '') {
      // The reason is in the container's own log and nowhere else — the
      // container is removed moments later by the `finally` block, taking the
      // log with it. Observed on a clean clone, where the image downloads BDS
      // on first start: without these lines the run only said "exited".
      const tail = text.split('\n').filter((l) => l.trim() !== '').slice(-15).join('\n');
      throw new Error(
        `the BDS container exited while waiting for ${label}. Last lines of its log:\n${tail}`
      );
    }
    sleep(2000);
  }
}

/**
 * Locate the bedrock_server process and write a console command to its stdin.
 *
 * The image ships `send-command` for this, but it identifies the process by
 * readlink(/proc/<pid>/exe), and under Rosetta every process in the container
 * reports /run/rosetta/rosetta — so it always answers "unable to find bedrock
 * server process". The cmdline still names the real binary, and mc-server-runner
 * has to be skipped because its own cmdline names it too.
 */
function sendCommand(command) {
  const find =
    'for p in /proc/[0-9]*; do c=$(tr "\\0" " " < $p/cmdline); ' +
    'case "$c" in *mc-server-runner*) continue;; *bedrock_server-*) basename $p; break;; esac; done';
  const res = spawnSync('docker', ['exec', 'andrew-bds', 'sh', '-c', find], { encoding: 'utf-8' });
  const pid = (res.stdout ?? '').trim();
  if (!/^\d+$/.test(pid)) {
    throw new Error(`could not find the bedrock_server process in the container (got ${JSON.stringify(pid)})`);
  }
  // Single-quoted in the shell, and commands here are literals from this file —
  // nothing from the log or the environment reaches this string.
  const write = spawnSync(
    'docker',
    ['exec', 'andrew-bds', 'sh', '-c', `echo '${command}' > /proc/${pid}/fd/0`],
    { encoding: 'utf-8' }
  );
  if (write.status !== 0) {
    throw new Error(`writing "${command}" to the server console failed: ${(write.stderr ?? '').trim()}`);
  }
  log(`▶ console: ${command}`);
}

// ------------------------------------------------------------------ verdict

/**
 * Read the run out of the log.
 *
 * The GameTest runner prints one "onTestPassed"/"onTestFailed" line per test.
 * A test that produced neither is reported as missing rather than ignored:
 * silence is the failure mode that would otherwise turn an empty run green.
 */
function analyzeLog(text) {
  const lines = text.split('\n').map((l) => l.trimEnd());
  const problems = [];
  const evidence = [];
  const results = new Map();

  const experiment = lines.find((l) => l.includes(EXPERIMENT_ACTIVE));
  if (experiment) evidence.push(experiment.trim());
  else problems.push(`"${EXPERIMENT_ACTIVE}" is absent — the Beta APIs experiment did not take`);

  if (lines.some((l) => l.includes(SCRIPT_LOADED))) evidence.push(SCRIPT_LOADED);
  else problems.push(`"${SCRIPT_LOADED}" is absent — the gametest pack script did not execute`);

  for (const line of lines) {
    const passed = line.match(/onTestPassed:\s*(\S+)/);
    if (passed) results.set(passed[1], { ok: true, line: line.trim() });
    const failed = line.match(/onTestFailed:\s*(\S+)\s*-?\s*(.*)$/);
    if (failed) results.set(failed[1], { ok: false, line: line.trim() });
  }

  for (const name of EXPECTED_TESTS) {
    const result = results.get(name);
    if (!result) problems.push(`${name} produced no onTestPassed/onTestFailed line — it never ran`);
    else if (!result.ok) problems.push(result.line);
    else evidence.push(result.line);
  }

  return { problems: [...new Set(problems)], evidence, results };
}

// --------------------------------------------------------------------- main

function main() {
  const opts = parseArgs(process.argv.slice(2));

  assertComposePinsVersion();
  assertDockerRunning();

  if (opts.build) buildAddon();
  if (!existsSync(addonPath)) throw new Error(`${addonPath} not found — run "npm run build" first`);

  bundleGameTestScript();
  writeStructure({ sx: 7, sy: 5, sz: 7 });

  const packs = unpackAddon(null);
  let text = '';
  try {
    const deadline = Date.now() + opts.timeoutSec * 1000;

    // --- phase 1: generate the world.
    // level.dat does not exist until the engine has made one, and the pack
    // cannot load before the experiment is on — so this boot runs bare.
    mkdirSync(dataDir, { recursive: true });
    cpSync(seedProperties, join(dataDir, 'server.properties'), { force: true });
    rmSync(worldDir, { recursive: true, force: true });
    for (const f of readdirSync(dataDir)) {
      if (f.startsWith('ContentLog')) rmSync(join(dataDir, f), { force: true });
    }
    compose(['down']);
    log('▶ phase 1/2: creating a fresh "gametest" world (first run downloads BDS)');
    up();
    waitFor('the world to be created', (t) => SERVER_STARTED.test(t), deadline);
    compose(['stop', '-t', '30'], { stdio: 'inherit' });

    // --- phase 2: experiment on, packs in, run the tests.
    enableBetaApis();
    installPacks(packs);
    compose(['down']);
    log('▶ phase 2/2: starting BDS with the gametest pack');
    up();
    waitFor(
      'the gametest script to load',
      (t) => SERVER_STARTED.test(t) && t.includes(SCRIPT_LOADED),
      deadline
    );

    for (const name of EXPECTED_TESTS) {
      // Remove the previous test's structure, so the next one is placed on the
      // same clear ground instead of being pushed aside by the leftovers.
      sendCommand('gametest clearall');
      sendCommand(`gametest run ${name}`);
      try {
        waitFor(
          `${name} to report`,
          (t) => t.includes(`onTestPassed: ${name}`) || t.includes(`onTestFailed: ${name}`),
          deadline
        );
      } catch (err) {
        // A timeout is a result, not a crash: the log still says how far the run
        // got, and analyzeLog turns that into a named problem.
        log(`✗ ${err.message}`);
        break;
      }
    }
    text = readLog();
  } finally {
    rmSync(packs.tmp, { recursive: true, force: true });
    if (!text) text = readLog();
    if (!opts.keepUp) compose(['down'], { stdio: 'inherit' });
  }

  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(logPath, text);

  const { problems, evidence, results } = analyzeLog(text);

  log('');
  log('GameTest results:');
  if (results.size === 0) log('  (no onTestPassed/onTestFailed lines in the log)');
  for (const [name, result] of results) log(`  ${result.ok ? '✓' : '✗'} ${name}`);

  log('');
  if (problems.length > 0) {
    log('FAIL — the simulated-player scenarios did not pass on BDS:');
    for (const p of problems) log(`  ✗ ${p}`);
    log('');
    log(`Full server log: ${logPath}`);
    process.exit(1);
  }

  log(
    'PASS — simulated players proved the pickaxe, the Web Sword craft gate, death retention and the ' +
      'trap ability on BDS, with no human involved:'
  );
  for (const e of evidence) log(`  ✓ ${e}`);
  log('');
  log(`Full server log: ${logPath}`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`bds:gametest: ${err.message}\n`);
  process.exit(1);
}
