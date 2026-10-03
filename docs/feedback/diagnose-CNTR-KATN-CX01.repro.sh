#!/usr/bin/env bash
# CX-katn-01 check on BDS: does a player stay out of lava when placed in a cell
# the amended L0-adr-ktob §3 calls safe — air directly above lava?
#
# Exit 0: the player placed there takes no lava damage within 40 ticks.
# Exit 1: they do — the cell rule leaves the lava death path open.
# Exit 2: no verdict (the build or run failed, or a control misbehaved).
#
# The probe is not part of the shipped gametest pack: this script copies it into
# src/gametest/ for one run and restores main.ts and bds-gametest.mjs on exit.
# ANDREW_BDS_DIR picks the BDS instance (default bds-ci); agents of one wave
# share andrew-bds-ci, so give each a copy with its own container name and ports.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log
probe=src/gametest/probe-katn-cx01-safe.ts

cp docs/feedback/diagnose-CNTR-KATN-CX01.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap 'rm -f "$probe"; mv src/gametest/main.ts.bak src/gametest/main.ts; mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs' EXIT

echo 'import "./probe-katn-cx01-safe";' >> src/gametest/main.ts
node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  fs.writeFileSync(f, s.replace(marker, marker + "\n  \"andrew:probe_katn_cx01_safe\","));
' || exit 2

npx tsc --noEmit -p . || exit 2
echo "tsc: probe compiles against the stable typings"

node scripts/bds-gametest.mjs --only andrew:probe_katn_cx01_safe || exit 2
grep -E "\[probe\] KATN" "$log" | sed 's/.*\[probe\] //'
grep -q "KATN RESULT .*verdict=safe-cell-above-lava-stays-out" "$log" && exit 0
grep -q "KATN RESULT .*verdict=safe-cell-above-lava-ends-in-lava" "$log" && exit 1
exit 2
