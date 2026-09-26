// npm run bds:check — prove the built add-on loads on a real Bedrock engine
// AND that the content it ships is actually there and configured as specified.
//
// Builds dist/andrew.mcaddon, installs both release packs plus the dev-only
// packs/selftest behavior pack into the BDS data directory, attaches them to
// the world, starts the server, reads the log and stops — three times over the
// same world, so the self-check can measure what survives a restart (strf-p006
// Q5) and that two restarts add no second spawn Windmill (L0-wind-r011).
//
// The verdict is derived from the log only — see analyzeLog() for the exact
// rules and for why the resource pack is proven by the absence of a warning.
// The self-check pack contributes its own verdict: it runs inside the engine
// and prints "[selftest] PASS/FAIL …" plus a final "[selftest] DONE" line.
//
// Staging (build, unpack, install, world config) is shared with
// `npm run bds:up` via scripts/bds-lib.mjs — this file owns only the
// creative one-shot flow, the self-check pack and the log analysis.
//
//   npm run bds:check
//   npm run bds:check -- --overlay tests/fixtures/bds/broken-dependency
//   npm run bds:check -- --no-build --timeout 120
//   npm run bds:check -- --break-selftest   # negative test: must exit non-zero

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  addonPath,
  assertComposePinsVersion,
  assertDockerRunning,
  buildAddon,
  compose,
  log,
  readLog,
  root,
  runServer,
  SCRIPT_LOADED,
  stageDataDir,
  unpackAddon,
} from './bds-lib.mjs';
import { bundleSelfTest } from './build.mjs';

const logPath = join(root, 'dist', 'bds-check.log');

// The self-check pack lives in the working tree, not in the archive — it is
// deliberately excluded from dist/andrew.mcaddon.
const selftestDir = join(root, 'packs', 'selftest');
const ST_DIR_NAME = 'andrew_selftest';

const SELFTEST_TAG = '[selftest]';
const SELFTEST_DONE = '[selftest] DONE';

// The prefix every console.warn from the add-on's own script carries in the
// server log: "[Scripting] [andrew] …". BDS logs all script output at WARN,
// so without this marker each new diagnostic line the add-on prints would be
// read as an engine complaint about our packs.
const ANDREW_DIAGNOSTIC = '[Scripting] [andrew] ';

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = { build: true, overlay: null, timeoutSec: 600, breakSelfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-build') opts.build = false;
    else if (arg === '--overlay') opts.overlay = argv[++i];
    else if (arg === '--timeout') opts.timeoutSec = Number(argv[++i]);
    else if (arg === '--break-selftest') opts.breakSelfTest = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(opts.timeoutSec) || opts.timeoutSec <= 0) {
    throw new Error('--timeout must be a positive number of seconds');
  }
  return opts;
}

// ------------------------------------------------------------ self-check pack

/**
 * Load the dev-only self-check pack straight from the working tree.
 *
 * It is read from packs/selftest rather than from the archive on purpose: the
 * archive is the release artifact and must not contain it. `npm run build`
 * bundles its script; --break-selftest rebundles it with the failing fixture
 * compiled in, into the staging copy only.
 */
function loadSelfTestPack({ breakSelfTest }) {
  const manifestPath = join(selftestDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath} not found — the self-check pack is missing`);
  }

  if (breakSelfTest) {
    log('▶ rebundling selftest with the deliberate-failure fixture (--break-selftest)');
    bundleSelfTest({ fixture: true });
  }

  const entryPath = join(selftestDir, 'scripts', 'main.js');
  if (!existsSync(entryPath)) {
    throw new Error(`${entryPath} not found — run "npm run build" first`);
  }

  return { dir: selftestDir, manifest: JSON.parse(readFileSync(manifestPath, 'utf-8')), dirName: ST_DIR_NAME };
}

// ----------------------------------------------------------------- analysis

/**
 * Decide PASS/FAIL from the server log.
 *
 * Behavior packs — proven positively: BDS prints a "Pack Stack" line naming
 * each pack and its uuid.
 *
 * Resource pack — proven negatively, because BDS does not print a stack line
 * for resource packs at world load. It does, however, validate every pack id
 * configured in world_resource_packs.json and warns "Configured pack (id: …)
 * was not found and was ignored" for any it cannot resolve. That detector was
 * verified by deliberately breaking the resource pack uuid: the warning
 * appears when the pack is missing and is absent when it resolves. So a
 * configured id with no such warning means the engine accepted the pack.
 *
 * Self-check — its own PASS/FAIL lines plus the DONE counters; the counters
 * win over the lines, so a FAIL lost to log truncation cannot turn a run green.
 */
function analyzeLog(text, { behavior, resource, selftest }) {
  const bpUuid = behavior.manifest.header.uuid;
  const rpUuid = resource.manifest.header.uuid;
  const stUuid = selftest.manifest.header.uuid;
  const lines = text.split('\n').map((l) => l.trimEnd());

  const problems = [];
  const evidence = [];

  // --- behavior packs loaded (positive signal)
  for (const [label, uuid] of [
    ['behavior pack', bpUuid],
    ['self-check pack', stUuid],
  ]) {
    const packStack = lines.find(
      (l) => l.includes('Pack Stack') && l.toLowerCase().includes(uuid.toLowerCase())
    );
    if (packStack) evidence.push(packStack.trim());
    else problems.push(`${label} ${uuid} never appeared in a "Pack Stack" line — it was not loaded`);
  }

  // --- no pack was rejected by the engine (negative signal)
  const ignored = lines.filter((l) => /Configured pack .*was not found and was ignored/i.test(l));
  for (const line of ignored) {
    const lower = line.toLowerCase();
    if (lower.includes(bpUuid.toLowerCase())) problems.push(`behavior pack rejected: ${line.trim()}`);
    else if (lower.includes(rpUuid.toLowerCase())) problems.push(`resource pack rejected: ${line.trim()}`);
    else if (lower.includes(stUuid.toLowerCase())) problems.push(`self-check pack rejected: ${line.trim()}`);
  }
  if (!ignored.some((l) => l.toLowerCase().includes(rpUuid.toLowerCase()))) {
    evidence.push(`resource pack ${rpUuid} configured and not rejected by the engine`);
  }

  // --- manifest / dependency / content errors about our packs
  for (const line of lines) {
    if (!/\b(ERROR|WARN)\]/.test(line)) continue;

    // Self-check lines reach the log as warnings too and are judged separately
    // below — leaving them here would double-report a FAIL and, worse, make a
    // PASS line mentioning "andrew:…" look like an engine complaint.
    if (line.includes(SELFTEST_TAG)) continue;

    if (/Configured pack .*was not found and was ignored/i.test(line)) continue; // handled above

    // The engine derives a bare alias from a custom command's un-namespaced
    // tail (andrew:structure -> structure); when something else already owns
    // that bare name — here, the vanilla /structure command — it falls back to
    // requiring the qualified form. Informational, not a defect: our own code
    // and docs invoke /andrew:structure fully qualified already.
    if (/Custom Command alias \[.+\] already in use\. Required to use full name \[.+\]/i.test(line)) {
      evidence.push(line.trim());
      continue;
    }

    // Our own console.warn output is not an engine complaint. Keyed on the
    // marker rather than on one known line: the add-on prints several
    // diagnostics now, and each of them names "andrew" by construction. This
    // only suppresses the *mentionsOurs* half — a line of ours that reports a
    // failure still trips the scriptFailure test below, and engine errors
    // about our namespace never carry the "[Scripting] [andrew] " prefix.
    const ourDiagnostic = line.includes(ANDREW_DIAGNOSTIC);

    // Anything the engine complains about that names our namespace or any of
    // our pack uuids — manifest, dependency and item-schema errors all land here.
    const mentionsOurs =
      !ourDiagnostic &&
      (/andrew/i.test(line) ||
        line.toLowerCase().includes(bpUuid.toLowerCase()) ||
        line.toLowerCase().includes(rpUuid.toLowerCase()) ||
        line.toLowerCase().includes(stUuid.toLowerCase()));

    // A script engine failure is ours even when the message names no pack.
    const scriptFailure =
      line.includes('[Scripting]') && /error|exception|failed|cannot|unable|not found/i.test(line);

    if (mentionsOurs || scriptFailure) problems.push(line.trim());
  }

  // --- the release script actually ran
  const scriptLine = lines.find((l) => l.includes(SCRIPT_LOADED));
  if (scriptLine) evidence.push(scriptLine.trim());
  else problems.push(`"${SCRIPT_LOADED}" is absent from the log — the pack script did not execute`);

  // --- the in-engine self-check
  const selftestLines = lines
    .filter((l) => l.includes(SELFTEST_TAG))
    .map((l) => l.slice(l.indexOf(SELFTEST_TAG)).trim());

  for (const line of selftestLines.filter((l) => l.startsWith('[selftest] FAIL'))) {
    problems.push(line);
  }

  const doneLine = selftestLines.find((l) => l.startsWith(SELFTEST_DONE));
  if (!doneLine) {
    problems.push(
      `"${SELFTEST_DONE}" is absent from the log — the self-check did not finish ` +
        '(it never ran, or it threw before reporting)'
    );
  } else {
    const failed = Number(doneLine.match(/failed=(\d+)/)?.[1] ?? NaN);
    const passed = Number(doneLine.match(/passed=(\d+)/)?.[1] ?? NaN);
    if (!Number.isFinite(failed) || !Number.isFinite(passed)) {
      problems.push(`cannot read the self-check counters from: ${doneLine}`);
    } else if (failed > 0) {
      problems.push(`the self-check reported ${failed} failing check(s): ${doneLine}`);
    } else if (passed === 0) {
      problems.push(`the self-check ran no checks at all: ${doneLine}`);
    }
  }

  return { problems: [...new Set(problems)], evidence, selftestLines };
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

  const packs = {
    ...unpackAddon(opts.overlay),
    selftest: loadSelfTestPack({ breakSelfTest: opts.breakSelfTest }),
  };
  const runs = [];
  try {
    stageDataDir({ ...packs, extraBehaviorPacks: [packs.selftest] });
    // A previous container would otherwise keep serving its own old log.
    compose(['down']);
    // Three runs over one world: strf-p006 Q5/Q6 spawn mobs in run 1 and count
    // them in run 2 (src/selftest/mob-probe.ts); the spawn Windmill found in
    // run 1 must be the only one after two restarts. The self-check runs at
    // worldLoad and prints DONE last, so waiting for both markers is what makes
    // "absent" mean "never happened". Run 1 includes the spawn search itself,
    // which on a rough seed samples up to 500 blocks around spawn.
    for (const n of [1, 2, 3]) {
      if (n === 2) {
        log('▶ restart: stopping BDS (the world is saved on stop) and starting it again on the same world');
      }
      const result = runServer(opts.timeoutSec, {}, { waitFor: [SCRIPT_LOADED, SELFTEST_DONE], markerWaitMs: 420_000 });
      // `stop` makes BDS save the world; the stopped container still holds the log.
      compose(['stop', '-t', '60'], { stdio: 'inherit' });
      runs.push({ ...result, text: readLog() });
      compose(['down']);
      if (!result.started) break;
    }
  } finally {
    rmSync(packs.tmp, { recursive: true, force: true });
    if (opts.breakSelfTest) {
      // Never leave the sabotaged bundle in the working tree: the next
      // --no-build run would inherit it and fail for a reason nobody asked for.
      bundleSelfTest({ fixture: false });
    }
  }

  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(logPath, runs.map((r, i) => `======== run ${i + 1} of ${runs.length} ========\n${r.text}`).join('\n'));
  log(`▶ log saved to ${logPath}`);

  const problems = [];
  const evidence = [];
  const selftestLines = [];
  runs.forEach((result, i) => {
    const run = `run ${i + 1}`;
    const analysis = analyzeLog(result.text, packs);
    problems.push(...analysis.problems.map((p) => `${run}: ${p}`));
    evidence.push(...analysis.evidence.map((e) => `${run}: ${e}`));
    selftestLines.push(...analysis.selftestLines.map((l) => `${run}: ${l}`));
    if (!result.started) {
      problems.unshift(
        `${run}: ` +
          (result.exited
            ? 'the BDS container exited before the server started'
            : `the server did not report "Server started." within ${opts.timeoutSec}s`)
      );
    }
    // Which phase ran is decided by a marker in the saved world: a run 2 that
    // reran phase 1 means the world did not survive the restart.
    const phases = i < 2 ? [`probe-mobs-restart-run${i + 1}`, `strf-registry-restart-run${i + 1}`, `windmill-restart-run${i + 1}`, `bastion-restart-run${i + 1}`] : [];
    for (const phase of [...phases, `spawn-windmill-run${i + 1}`]) {
      if (result.started && !analysis.selftestLines.some((l) => l.includes(phase))) {
        problems.push(`${run}: the self-check never reported ${phase} — the restart check ran the wrong phase or not at all`);
      }
    }
  });
  if (runs.length < 3) problems.push(`only ${runs.length} of 3 runs happened — a restart never started`);

  // Every self-check line, verbatim, on both verdicts — this is the part a
  // human reads to see what the engine actually said about the content.
  log('');
  if (selftestLines.length > 0) {
    log('In-engine self-check:');
    for (const l of selftestLines) log(`  ${l}`);
  } else {
    log('In-engine self-check: no [selftest] output in the log.');
  }

  const probeResults = selftestLines.filter((l) => / RESULT /.test(l));
  if (probeResults.length > 0) {
    log('');
    log('Engine probe answers:');
    for (const l of probeResults) log(`  ${l}`);
  }

  log('');
  if (problems.length > 0) {
    log('FAIL — BDS did not load the add-on cleanly, or the self-check failed:');
    for (const p of problems) log(`  ✗ ${p}`);
    log('');
    log(`Full server log: ${logPath}`);
    process.exit(1);
  }

  log('PASS — BDS loaded the add-on, ran its script and the self-check passed:');
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
