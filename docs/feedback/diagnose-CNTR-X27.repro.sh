#!/usr/bin/env bash
# CX-L0-27 on BDS: does a raised shield cancel script applyDamage regardless of
# where its holder faces (facing), which damage causes pass a raised shield and
# which of them armour reduces (causes), and what option (b) — manual armour on
# a cause the shield ignores — takes from diamond + Protection IV (causes runs
# probe_x27_manual too).
#
#   env ANDREW_BDS_DIR=../dist/bds-x27 docs/feedback/diagnose-CNTR-X27.repro.sh facing|causes
#
# Exit 0: the selected probe tests ran to the end with their controls holding
# (unshielded holders take the hit, a diamond-sword hit from the front is
# blocked, armour reduces entityAttack, isSneaking reads back as set). The
# answers are the "[probe] X27" lines; the full set goes to dist/x27-<mode>.txt,
# the compact rows to stdout last (a run-check artifact keeps only the tail).
#
# The probe is not part of the shipped gametest pack: this script copies it into
# src/gametest/ and restores main.ts and bds-gametest.mjs on exit. Give it a
# private BDS instance; agents of one wave share andrew-bds-ci.

set -u
cd "$(dirname "$0")/../.."
mode="${1:-}"
case "$mode" in
  facing) tests="andrew:probe_x27_facing" ;;
  causes) tests="andrew:probe_x27_causes andrew:probe_x27_manual" ;;
  *) echo "usage: $0 facing|causes"; exit 2 ;;
esac
case "${ANDREW_BDS_DIR:-}" in
  ""|bds|bds-ci|bds-qa) echo "ANDREW_BDS_DIR=${ANDREW_BDS_DIR:-} is shared; name a private instance under dist/"; exit 2 ;;
esac
log=dist/bds-gametest.log
out="dist/x27-$mode.txt"
probe=src/gametest/probe-x27-shield.ts

[ -e "$probe" ] && { echo "$probe already exists; this script would delete it on exit"; exit 1; }
cp docs/feedback/diagnose-CNTR-X27.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap 'rm -f "$probe"; mv src/gametest/main.ts.bak src/gametest/main.ts; mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs' EXIT

echo 'import "./probe-x27-shield";' >> src/gametest/main.ts
node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  fs.writeFileSync(f, s.replace(marker, marker + "\n  \"andrew:probe_x27_facing\",\n  \"andrew:probe_x27_causes\",\n  \"andrew:probe_x27_manual\","));
' || exit 1

npx tsc --noEmit -p . || exit 1
echo "tsc: probe compiles against the stable typings"

only=()
for t in $tests; do only+=(--only "$t"); done
node scripts/bds-gametest.mjs "${only[@]}" || exit 1

grep -E "\[probe\] X27 " "$log" | sed 's/.*\[probe\] X27 //' | tr -d '\r' > "$out"
echo "--- full probe lines: $out ($(wc -l < "$out" | tr -d ' ') lines)"
grep -E "^(setup|MANUAL kits)" "$out" | cut -c1-400
if [ "$mode" = facing ]; then
  echo "--- how shield nominal measured° dist took took+1 ret wear (source = entityAttack 10 unless melee)"
  grep -E "^FROW " "$out" | cut -d' ' -f2- | column -t
  grep -E "^RESULT" "$out"
else
  echo "--- cause src bare shield-front shield-back diamond+prot4 diamond ret(bare)   [took, HP, from 10]"
  grep -E "^ROW " "$out" | cut -d' ' -f2- | column -t
  grep -E "^MANUAL (model|native|option-b)" "$out" | sed -E 's/ hurt=\[[^]]*\]//g' | cut -c1-260
  grep -E "^RESULT" "$out"
fi
for t in $tests; do grep -q "onTestPassed: $t" "$log" || { echo "FAIL: $t did not pass"; exit 1; }; done
echo "all selected probe tests passed"
