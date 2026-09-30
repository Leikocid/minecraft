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
//   npm run bds:gametest -- --no-build --timeout 1800
//   npm run bds:gametest -- --keep-up      # leave the server running to inspect
//   npm run bds:gametest -- --only andrew:probe_fire_resistance_noon   # one test, for iteration

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMcstructure } from './lib/mcstructure.mjs';
import { TAG_BYTE, readNbt, writeNbt } from './lib/nbt.mjs';
import {
  addonPath,
  assertComposePinsVersion,
  assertDockerRunning,
  buildAddon,
  compose,
  containerName,
  dataDir,
  log,
  root,
  seedProperties,
  unpackAddon,
} from './bds-lib.mjs';

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
// The release pack's spawn-Windmill search must stand down in this world:
// every test runs at its spawn. On a fresh world nothing is enabled, so it
// never starts; were Windmill enabled, src/gametest/main.ts sends the skip.
const SPAWN_SEARCH_STOOD_DOWN = ['[andrew] spawn windmill: not started: windmill is not enabled', '[andrew] spawn windmill: search finished: skipped'];
// The world is deleted before every run, so the release pack's load line must name no type.
const ENABLED_NONE = '[andrew] structures enabled: none';

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
  'andrew:web_sword_cuts_its_own_web',
  'andrew:pickaxe_digs_at_diamond_speed',
  'andrew:pickaxe_autosmelt',
  'andrew:pickaxe_keeps_vanilla_drops',
  'andrew:websword_first_claim',
  'andrew:websword_second_refund',
  'andrew:websword_creative_ignored',
  'andrew:websword_death_returns',
  'andrew:websword_unmarked_drops',
  // CX-lgnd-10 — src/gametest/probe-retention.ts
  'andrew:probe_retention_two_copies',
  'andrew:probe_retention_offhand',
  'andrew:websword_cube_placed',
  'andrew:websword_protected_skipped',
  'andrew:websword_out_of_reach_noop',
  'andrew:websword_cooldown_blocks_reuse',
  'andrew:legendary_returns_from_void',
  'andrew:legendary_survives_lava',
  'andrew:legendary_survives_fire',
  'andrew:legendary_pickup_no_duplicate',
  // CX-lgnd-09 items 2–3 — src/gametest/legendary-recovery.ts
  'andrew:legendary_cx09_hopper_to_chest',
  'andrew:legendary_cx09_hopper_alone',
  'andrew:legendary_cx09_hopper_minecart',
  'andrew:legendary_cx09_owed_two_losses',
  'andrew:legendary_cx09_owed_redeemed_on_respawn',
  'andrew:scythe_melee_matches_netherite',
  'andrew:scythe_no_target_no_cooldown',
  'andrew:scythe_prefers_player_over_mob',
  'andrew:scythe_hits_mob_when_alone',
  'andrew:scythe_skips_hidden',
  'andrew:scythe_three_hits_true_damage',
  'andrew:scythe_launches_target',
  'andrew:scythe_through_walls',
  'andrew:scythe_out_of_radius_no_cooldown',
  'andrew:scythe_out_of_radius_after_hit_cooldown',
  'andrew:scythe_cleanup_on_target_death',
  'andrew:scythe_lethal_hit_kills',
  // stage4-probe strf-p006 questions 1, 2, 7, 10 — src/gametest/probe-place.ts
  'andrew:probe_place_block_entities',
  'andrew:probe_place_rotation',
  'andrew:probe_place_timing',
  'andrew:probe_fill_air_limits',
  // strf-p006 questions 9, 11, 8 — src/gametest/probe-chunk.ts
  'andrew:probe_chunk_loaded',
  'andrew:probe_tickingarea_load',
  'andrew:probe_dynamic_property_budget',
  // strf-p006 questions 3, 6 — src/gametest/probe-mobs.ts (Q5 and the restart
  // half of Q6 run in bds:check: they need two server runs over one world)
  'andrew:probe_shrieker_summons_warden',
  'andrew:probe_fire_resistance_noon',
  'andrew:probe_cured_villager_keeps_name',
  // strf-p006 question 4 — src/gametest/probe-loot.ts
  'andrew:probe_loot_ancient_city',
  'andrew:probe_loot_bastion_treasure',
  'andrew:probe_loot_bastion_other',
  'andrew:probe_loot_control_known_table',
  'andrew:probe_loot_full_chest',
  // CX-L0-09 — src/gametest/probe-give.ts; verdict read by docs/feedback/diagnose-CNTR-XCX9-AA.repro.sh
  'andrew:probe_xcx9_give_websword',
  'andrew:probe_xcx9_give_scythe',
  'andrew:probe_xcx9_give_then_craft',
  'andrew:probe_xcx9_give_after_craft',
  'andrew:probe_xcx9_creative_copy_pickup',
  // LGND-CRAFTGATE-01 — src/gametest/legendary-craftgate.ts
  'andrew:legendary_give_then_craft_web_sword',
  'andrew:legendary_give_then_craft_scythe',
  'andrew:legendary_second_real_craft_refunded',
  // LGND-OFFHAND-01 — src/gametest/legendary-offhand.ts
  'andrew:legendary_offhand_admitted',
  'andrew:legendary_offhand_resolves',
  'andrew:legendary_offhand_death_returns',
  'andrew:legendary_offhand_token_refused',
  // STRF-REG-01 — src/gametest/strf-registry.ts
  'andrew:strf_registry_steps_idempotent',
  // STRF-ROLL-01 — src/gametest/structures.ts
  'andrew:strf_discovery_tick_budget',
  // STRF-SITE-01 — src/gametest/structures-site.ts
  'andrew:strf_site_profiles',
  'andrew:strf_site_player_build',
  'andrew:strf_site_pending_unloaded',
  'andrew:strf_site_recheck',
  // STRF-PLACE-01 — src/gametest/structures-place.ts
  'andrew:strf_place_rotations',
  'andrew:strf_place_clear_sliced',
  'andrew:strf_place_block_entities',
  'andrew:strf_place_resume',
  'andrew:strf_place_protects_legendaries',
  // LOOT-TBL-01 — src/gametest/structures-loot.ts
  'andrew:strf_loot_custom',
  'andrew:strf_loot_ancient_city',
  'andrew:strf_loot_bastion_treasure',
  'andrew:strf_loot_bastion_other',
  'andrew:strf_loot_control',
  'andrew:strf_loot_full_chest',
  // STRF-CMD-01 — src/gametest/structures-commands.ts
  'andrew:strf_cmd_place',
  'andrew:strf_cmd_locate_tp',
  'andrew:strf_cmd_chance',
  'andrew:strf_cmd_operator_only',
  // STRF-FIND-01 — src/gametest/structures-commands.ts
  'andrew:strf_cmd_find',
  'andrew:strf_cmd_find_refuses',
  // WIND-TMPL-01 — src/gametest/windmill.ts
  'andrew:windmill_rotations',
  'andrew:windmill_vindicator_axe',
  // WIND-BODY-01 — src/gametest/windmill-body.ts
  'andrew:windmill_body_site_cancel',
  'andrew:windmill_body_init',
  'andrew:windmill_guard_noon',
  'andrew:windmill_guard_cured',
  // STRF-SUBSET-01 — src/gametest/windmill-body.ts
  'andrew:windmill_body_airship_disabled',
  // WIND-SPAWN-01 — src/gametest/windmill-spawn.ts
  'andrew:windmill_spawn_once',
  'andrew:windmill_spawn_holds_discovery',
  'andrew:windmill_spawn_prep_smooth',
  'andrew:windmill_spawn_prep_aborts',
  'andrew:windmill_spawn_no_dry_land',
  // AIRS-TMPL-01 — src/gametest/airship.ts
  'andrew:airship_rotations',
  'andrew:airship_spawner_light',
  // AIRS-BODY-01 — src/gametest/airship-body.ts
  'andrew:airship_body_site',
  'andrew:airship_linked_ring',
  'andrew:airship_linked_over_windmill',
  'andrew:airship_linked_no_merge',
  'andrew:airship_linked_ring_invalid',
  // WRDN-TMPL-01 — src/gametest/warden.ts
  'andrew:warden_rotations',
  'andrew:warden_dig_down',
  // WRDN-BODY-01 — src/gametest/warden-body.ts
  'andrew:warden_body_generate',
  'andrew:warden_body_site',
  // BAST-TMPL-01 — src/gametest/bastion.ts
  'andrew:bastion_nether_rotations',
  'andrew:bastion_treasure_access',
  'andrew:bastion_lava_vanilla',
  // BAST-BODY-01 — src/gametest/bastion-body.ts
  'andrew:bastion_body_generate',
  'andrew:bastion_body_site',
  // CX-L0-14 — src/gametest/probe-input.ts
  'andrew:probe_input_survival',
  'andrew:probe_input_creative',
  'andrew:probe_input_face_location',
  // WSWD-FACE-01 — src/gametest/websword-trap.ts
  'andrew:websword_face_location',
  'andrew:websword_entity_ray_distance',
  'andrew:websword_ray_stoppers',
  'andrew:websword_wall_front_n',
  'andrew:websword_wall_front_e',
  'andrew:websword_wall_front_s',
  'andrew:websword_wall_front_w',
  'andrew:websword_wall_behind_n',
  'andrew:websword_wall_behind_e',
  'andrew:websword_wall_behind_s',
  'andrew:websword_wall_behind_w',
  'andrew:websword_wall_edge_n',
  'andrew:websword_wall_edge_e',
  'andrew:websword_wall_edge_s',
  'andrew:websword_wall_edge_w',
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
  // The zombie-villager cure alone waits up to 5.5 minutes of game time.
  const opts = { build: true, timeoutSec: 1800, keepUp: false, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-build') opts.build = false;
    else if (arg === '--keep-up') opts.keepUp = true;
    else if (arg === '--only') opts.only.push(argv[++i]);
    else if (arg === '--timeout') opts.timeoutSec = Number(argv[++i]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(opts.timeoutSec) || opts.timeoutSec <= 0) {
    throw new Error('--timeout must be a positive number of seconds');
  }
  const unknown = opts.only.filter((n) => !EXPECTED_TESTS.includes(n));
  if (unknown.length > 0) throw new Error(`--only: not in EXPECTED_TESTS: ${unknown.join(' ')}`);
  return opts;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
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
  const tag = buildMcstructure({
    size: [sx, sy, sz],
    palette: [{ name: 'minecraft:air' }, { name: 'minecraft:stone' }],
    primary,
  });

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
  const res = spawnSync('docker', ['exec', containerName, 'sh', '-c', find], { encoding: 'utf-8' });
  const pid = (res.stdout ?? '').trim();
  if (!/^\d+$/.test(pid)) {
    throw new Error(`could not find the bedrock_server process in container ${containerName} (got ${JSON.stringify(pid)})`);
  }
  // Single-quoted in the shell, and commands here are literals from this file —
  // nothing from the log or the environment reaches this string.
  const write = spawnSync(
    'docker',
    ['exec', containerName, 'sh', '-c', `echo '${command}' > /proc/${pid}/fd/0`],
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
function analyzeLog(text, expected) {
  const lines = text.split('\n').map((l) => l.trimEnd());
  const problems = [];
  const evidence = [];
  const results = new Map();

  const experiment = lines.find((l) => l.includes(EXPERIMENT_ACTIVE));
  if (experiment) evidence.push(experiment.trim());
  else problems.push(`"${EXPERIMENT_ACTIVE}" is absent — the Beta APIs experiment did not take`);

  if (lines.some((l) => l.includes(SCRIPT_LOADED))) evidence.push(SCRIPT_LOADED);
  else problems.push(`"${SCRIPT_LOADED}" is absent — the gametest pack script did not execute`);

  const stoodDown = lines.find((l) => SPAWN_SEARCH_STOOD_DOWN.some((m) => l.includes(m)));
  if (stoodDown) evidence.push(stoodDown.trim());
  else problems.push(`none of ${JSON.stringify(SPAWN_SEARCH_STOOD_DOWN)} — the release pack may have built its spawn Windmill where the tests run`);

  const enabledLine = lines.find((l) => l.includes('[andrew] structures enabled:'));
  if (enabledLine?.includes(ENABLED_NONE)) evidence.push(enabledLine.trim());
  else problems.push(`"${ENABLED_NONE}" is absent on a fresh world (got ${JSON.stringify(enabledLine?.trim() ?? null)})`);

  for (const line of lines) {
    const passed = line.match(/onTestPassed:\s*(\S+)/);
    if (passed) results.set(passed[1], { ok: true, line: line.trim() });
    const failed = line.match(/onTestFailed:\s*(\S+)\s*-?\s*(.*)$/);
    if (failed) results.set(failed[1], { ok: false, line: line.trim() });
  }

  for (const name of expected) {
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
  // A partial run is for iteration; only the full list proves the suite.
  const selected = opts.only.length > 0 ? opts.only : EXPECTED_TESTS;

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

    for (const name of selected) {
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

  const { problems, evidence, results } = analyzeLog(text, selected);

  log('');
  log('GameTest results:');
  if (results.size === 0) log('  (no onTestPassed/onTestFailed lines in the log)');
  for (const [name, result] of results) log(`  ${result.ok ? '✓' : '✗'} ${name}`);

  // Probe tests report engine answers, not pass/fail of the product; their
  // verdict lines are the deliverable, so they go into the summary too.
  const probeResults = text.split('\n').filter((l) => / \[probe\] .*RESULT /.test(l));
  if (probeResults.length > 0) {
    log('');
    log('Engine probe answers:');
    for (const l of probeResults) log(`  ${l.slice(l.indexOf('[probe]'))}`);
  }

  // Q8's other half: whatever the engine itself says about the size of the
  // dynamic-property store is not a script line, so it is echoed verbatim.
  const dpWarnings = text.split('\n').filter((l) => /dynamic.?propert/i.test(l) && !l.includes('[probe]') && !/onTest\w+:/.test(l));
  if (dpWarnings.length > 0) {
    log('');
    log('Engine lines about dynamic properties (Q8):');
    for (const l of dpWarnings) log(`  ${l.trim()}`);
  } else if (probeResults.some((l) => l.includes('Q8 RESULT'))) {
    log('  (Q8: the engine printed no line about dynamic properties)');
  }

  log('');
  if (selected !== EXPECTED_TESTS) log(`PARTIAL RUN (--only): ${selected.length} of ${EXPECTED_TESTS.length} tests — not a suite verdict`);
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
