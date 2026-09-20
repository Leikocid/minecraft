// npm run bds:up — LAN server for the iPad, with the *current* build.
//
// Builds dist/andrew.mcaddon and installs it the same way `npm run bds:check`
// does (scripts/bds-lib.mjs), then starts BDS in the background as a Survival
// world with cheats on — the only mode auto-smelt can be verified in
// [src: concept-constraint C-9] — and waits for the server to actually report
// a clean start before printing the address for the iPad.
//
// `npm run bds:check` stays creative: it re-stages the data dir from the seed
// server.properties on every run, so an earlier `bds:up` never leaks into it.
//
//   npm run bds:up
//   npm run bds:up -- --no-build --timeout 120

import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import {
  applyPropertyOverrides,
  assertComposePinsVersion,
  assertDockerRunning,
  buildAddon,
  compose,
  log,
  runServer,
  stageDataDir,
  unpackAddon,
} from './bds-lib.mjs';

function parseArgs(argv) {
  const opts = { build: true, timeoutSec: 300 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-build') opts.build = false;
    else if (arg === '--timeout') opts.timeoutSec = Number(argv[++i]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(opts.timeoutSec) || opts.timeoutSec <= 0) {
    throw new Error('--timeout must be a positive number of seconds');
  }
  return opts;
}

/** LAN IP of the Mac, from the active interface. macOS-only, by design (C-4/S0-7 rig is Mac-only). */
function detectLanIp() {
  for (const iface of ['en0', 'en1']) {
    const res = spawnSync('ipconfig', ['getifaddr', iface], { encoding: 'utf-8' });
    const ip = (res.stdout ?? '').trim();
    if (res.status === 0 && ip) return ip;
  }
  return null;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  assertComposePinsVersion();
  assertDockerRunning();

  if (opts.build) {
    buildAddon();
  }

  const packs = unpackAddon(null);
  let result;
  try {
    stageDataDir(packs);
    // texturepack-required forces the iPad to pull the resource pack (icons,
    // names) from the server rather than joining with it disabled. The image
    // does not manage this key from an env var, so writing it into the
    // staged file is enough (unlike gamemode — see runServer below).
    applyPropertyOverrides({
      'texturepack-required': 'true',
    });

    // A previous container would otherwise keep serving its own old log.
    compose(['down']);
    // Survival with cheats: auto-smelt can only be checked in Survival
    // [src: concept-constraint C-9], and cheats give the operator /give
    // without hunting for ores by hand. GAMEMODE must go through the
    // container's environment (BDS_GAMEMODE), not the properties file —
    // the entrypoint reapplies GAMEMODE from env on every start.
    result = runServer(opts.timeoutSec, { BDS_GAMEMODE: 'survival' });
  } finally {
    rmSync(packs.tmp, { recursive: true, force: true });
  }

  if (!result.started) {
    compose(['down'], { stdio: 'inherit' });
    throw new Error(
      result.exited
        ? 'the BDS container exited before the server started — see "npm run bds:logs"'
        : `the server did not report "Server started." within ${opts.timeoutSec}s — see "npm run bds:logs"`
    );
  }

  const bpUuid = packs.behavior.manifest.header.uuid;
  const bpVersion = packs.behavior.manifest.header.version.join('.');
  const packStack = result.text
    .split('\n')
    .find((l) => l.includes('Pack Stack') && l.toLowerCase().includes(bpUuid.toLowerCase()));
  if (packStack) {
    log(`✓ Pack Stack: ${packStack.trim()} (Andrew BP ${bpVersion})`);
  } else {
    log(`⚠ Pack Stack line for Andrew BP not seen yet — check "npm run bds:logs"`);
  }

  log('▶ server up: Survival, cheats on, texture pack required');

  const ip = detectLanIp();
  const address = ip ? `${ip}:19132` : 'IP не определён — посмотрите в Настройках macOS → Сеть';
  log(`Сервер поднят: ${address} — на iPad: Играть → Серверы → Добавить сервер`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`bds:up: ${err.message}\n`);
  process.exit(1);
}
