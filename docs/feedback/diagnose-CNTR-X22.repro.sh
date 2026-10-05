#!/usr/bin/env bash
# CX-L0-22 check on BDS: does the hurt-invulnerability window swallow a script
# applyDamage, and does the Scythe true-damage pattern still take exactly D per
# hit inside it (armour, raised shield, absorption, causes, the shipped volley)?
#
# Exit 0: every probe scenario and the two shipped Scythe damage tests ran to
#         the end; the answers are the "X22 …" lines printed below.
# Exit 2: no verdict (the build or run failed, or a scenario did not complete).
#
# The probe is not part of the shipped gametest pack: this script copies it into
# src/gametest/ for one run and restores main.ts and bds-gametest.mjs on exit.
# ANDREW_BDS_DIR picks the BDS instance (default bds-ci); agents of one wave
# share andrew-bds-ci, so give each a copy with its own container name and ports.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log
probe=src/gametest/probe-x22.ts
tests="andrew:probe_x22_window andrew:probe_x22_pattern andrew:probe_x22_shield_raised andrew:probe_x22_shield_lethal andrew:probe_x22_absorption andrew:probe_x22_causes andrew:probe_x22_scythe_live"
shipped="andrew:scythe_three_hits_true_damage andrew:scythe_lethal_hit_kills"

cp docs/feedback/diagnose-CNTR-X22.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap 'rm -f "$probe"; mv src/gametest/main.ts.bak src/gametest/main.ts; mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs' EXIT

echo 'import "./probe-x22";' >> src/gametest/main.ts
TESTS="$tests" node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  const names = process.env.TESTS.split(" ").map((n) => `\n  "${n}",`).join("");
  fs.writeFileSync(f, s.replace(marker, marker + names));
' || exit 2

npx tsc --noEmit -p . || exit 2
echo "tsc: probe compiles against the stable typings"

only=""
for t in $tests $shipped; do only="$only --only $t"; done
node scripts/bds-gametest.mjs $only || echo "bds-gametest exit $? (verdicts below)"
grep -E "\[probe\] X22" "$log" | sed 's/.*\[probe\] //'
grep -E "\[gametest\] scythe (damage|lethal)|\[andrew\] scythe volley: hit" "$log" | sed -E 's/.*(\[gametest\]|\[andrew\])/\1/'
fail=0
for t in $tests $shipped; do
  if grep -qF "onTestPassed: $t" "$log"; then echo "PASSED $t"; else echo "NOT PASSED $t"; fail=1; fi
done
[ "$fail" = 0 ] && exit 0
exit 2
