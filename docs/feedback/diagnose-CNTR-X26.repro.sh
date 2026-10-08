#!/usr/bin/env bash
# CX-L0-26 check on BDS, a vanilla diamond sword standing in for the Storm Blade:
# what applyDamage(6) takes in the tick of a melee hit, whether difference-stacking
# applyDamage(L + 6) nets +6 pre-armour (and what beforeEvents.entityHurt and a
# health write do), and what applyDamage(10) takes 1–11 ticks after a melee hit.
#
# Exit 0: every probe scenario ran to the end; the answers are the "X26 …" lines.
# Exit 2: no verdict (the build or run failed, or a scenario did not complete).
#
# The probe is not part of the shipped gametest pack: this script copies it into
# src/gametest/ for one run and restores main.ts and bds-gametest.mjs on exit.
# ANDREW_BDS_DIR must name a private instance; agents of one wave share andrew-bds-ci.

set -u
cd "$(dirname "$0")/../.."
: "${ANDREW_BDS_DIR:?set ANDREW_BDS_DIR to a private instance, e.g. ../dist/bds-x26}"
export ANDREW_BDS_DIR
log=dist/bds-gametest.log
probe=src/gametest/probe-x26.ts
tests=""
for s in passive_bare passive_diamond passive_netherite_p4 sharp_bare sharp_diamond active_bare active_diamond mob absorption; do
  tests="$tests andrew:probe_x26_$s"
done

cp docs/feedback/diagnose-CNTR-X26.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap 'rm -f "$probe"; mv src/gametest/main.ts.bak src/gametest/main.ts; mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs' EXIT

echo 'import "./probe-x26";' >> src/gametest/main.ts
TESTS="$tests" node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  const names = process.env.TESTS.trim().split(" ").map((n) => `\n  "${n}",`).join("");
  fs.writeFileSync(f, s.replace(marker, marker + names));
' || exit 2

npx tsc --noEmit -p . || exit 2
echo "tsc: probe compiles against the stable typings"

only=""
for t in $tests; do only="$only --only $t"; done
node scripts/bds-gametest.mjs $only || echo "bds-gametest exit $? (verdicts below)"
grep -E "\[probe\] X26" "$log" | sed 's/.*\[probe\] //'
fail=0
for t in $tests; do
  if grep -qF "onTestPassed: $t" "$log"; then echo "PASSED $t"; else echo "NOT PASSED $t"; fail=1; fi
done
[ "$fail" = 0 ] && exit 0
exit 2
