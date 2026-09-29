#!/usr/bin/env bash
# CX-L0-08 check on BDS: does the stable @minecraft/server 2.10.0 raise an
# event for an attack that hits nothing (sky, a block 12 away), and can the
# Orbital's 10-block view ray be cast from inside it?
#
# Exit 0: an Attack-filtered playerSwingStart fired once per attack at the sky,
# at 8 and at 12 blocks, never for a use. Exit 1: it did not, or the run failed.
#
# The probe is not part of the shipped gametest pack: this script copies it into
# src/gametest/ for one run and restores main.ts and bds-gametest.mjs on exit.
# ANDREW_BDS_DIR picks the BDS instance (default bds-ci); agents of one wave
# share andrew-bds-ci, so give each a copy with its own container name and ports.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log
probe=src/gametest/probe-xcx8-swing.ts

cp docs/feedback/diagnose-CNTR-XCX8-AA.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap 'rm -f "$probe"; mv src/gametest/main.ts.bak src/gametest/main.ts; mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs' EXIT

echo 'import "./probe-xcx8-swing";' >> src/gametest/main.ts
node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  fs.writeFileSync(f, s.replace(marker, marker + "\n  \"andrew:probe_xcx8_swing\","));
' || exit 1

node scripts/bds-gametest.mjs --only andrew:probe_xcx8_swing || exit 1
grep -E "\[probe\] XCX8" "$log" | sed 's/.*\[probe\] //'
grep -q "XCX8 RESULT .*verdict=attack-swing-fires-without-a-hit" "$log"
