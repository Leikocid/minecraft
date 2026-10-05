#!/usr/bin/env bash
# CX-sclk-02 / L0-sclk-p001 Q5 on BDS: what a custom minecraft:shooter
# (charge_on_draw, max_draw_duration 1.25 s, with and without
# scale_power_by_draw_duration) does when a SimulatedPlayer releases it 1–40
# ticks into the draw, against a vanilla bow and crossbow as controls.
#
# Exit 0: all nine probe scenarios ran to the end and printed their RESULT line.
# The answers are the "[probe] SCX2" lines; the verdict is read by a human.
#
# The probe is not part of the shipped gametest pack: this script copies it into
# src/gametest/, its items into packs/gametest/items/, and restores main.ts and
# bds-gametest.mjs on exit. ANDREW_BDS_DIR picks the BDS instance (default
# bds-ci); agents of one wave share andrew-bds-ci, so give each a private copy.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log
probe=src/gametest/probe-sclk-cx02.ts
items=packs/gametest/items
names=(vanilla_bow vanilla_crossbow vanilla_crossbow_qc3 cod cod_sp bow_sp bow cod_sp_ud25 cod_sp_qc3)

[ -e "$items" ] && { echo "$items already exists; this script would delete it on exit"; exit 1; }
cp docs/feedback/diagnose-CNTR-SCLK-CX02.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap 'rm -rf "$probe" "$items"; mv src/gametest/main.ts.bak src/gametest/main.ts; mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs' EXIT

echo 'import "./probe-sclk-cx02";' >> src/gametest/main.ts
mkdir -p "$items"
node -e '
  const fs = require("fs");
  const items = JSON.parse(fs.readFileSync("docs/feedback/diagnose-CNTR-SCLK-CX02.items.json", "utf8"));
  for (const [name, def] of Object.entries(items)) fs.writeFileSync(`packs/gametest/items/${name}.json`, JSON.stringify(def, null, 2));
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  const added = process.argv.slice(1).map((n) => `\n  "andrew:probe_sclk_cx02_${n}",`).join("");
  fs.writeFileSync(f, s.replace(marker, marker + added));
' "${names[@]}" || exit 1

# tsc resolves the probe against the pinned stable typings only; the gametest
# world below runs with the Beta APIs experiment on, so it cannot prove this.
d=node_modules/@minecraft/server
echo "@minecraft/server $(node -p "require('./$d/package.json').version")"
npx tsc --noEmit -p . || exit 1
echo "tsc: probe compiles against the stable typings"

only=()
for n in "${names[@]}"; do only+=(--only "andrew:probe_sclk_cx02_$n"); done
node scripts/bds-gametest.mjs "${only[@]}"
status=$?
grep -iE "probe_sx|minecraft:shooter" "$log" | grep -viE "\[probe\] SCX2" | sed 's/^/content-log: /' | head -20
grep -E "\[probe\] SCX2" "$log" | sed 's/.*\[probe\] //'
results=$(grep -cE "\[probe\] SCX2 [a-z0-9_]+ RESULT" "$log")
echo "RESULT lines: $results of ${#names[@]}; runner exit $status"
[ "$status" -eq 0 ] && [ "$results" -eq "${#names[@]}" ]
