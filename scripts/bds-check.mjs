// npm run bds:check — prove the built add-on loads on a real Bedrock engine.
//
// Builds dist/andrew.mcaddon, installs both packs into the BDS data directory,
// attaches them to the world, starts the server, reads the log and stops.
//
// The verdict is derived from the log only — see analyzeLog() for the exact
// rules and for why the resource pack is proven by the absence of a warning.
//
// Staging (build, unpack, install, world config) is shared with
// `npm run bds:up` via scripts/bds-lib.mjs — this file owns only the
// creative one-shot flow and the log analysis.
//
//   npm run bds:check
//   npm run bds:check -- --overlay tests/fixtures/bds/broken-dependency
//   npm run bds:check -- --no-build --timeout 120

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  addonPath,
  assertComposePinsVersion,
  assertDockerRunning,
  buildAddon,
  compose,
  log,
  root,
  runServer,
  SCRIPT_LOADED,
  stageDataDir,
  unpackAddon,
} from './bds-lib.mjs';

const logPath = join(root, 'dist', 'bds-check.log');

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
    buildAddon();
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
