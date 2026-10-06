#!/usr/bin/env bash
# Crossbow-look probe on BDS (docs/feedback/probe-crossbow-look.md, Q1, Q3, Q4 server half).
#
# For one run this script installs, and on exit removes:
#   - probe.ts as src/gametest/probe-look.ts, imported from main.ts;
#   - its scenario names in EXPECTED_TESTS of scripts/bds-gametest.mjs;
#   - items/*.json into packs/gametest/items/;
#   - the Molang readout (player-molang.mjs): player.json + bit controllers in packs/gametest.
# Nothing of this stays in the suite. ANDREW_BDS_DIR picks the instance; a wave shares
# andrew-bds-ci, so give the probe a private copy (e.g. ANDREW_BDS_DIR=../dist/bds-lookp).
#
# Exit 0: every selected scenario passed and printed its RESULT line. The answers are the
# "[probe] LOOK" lines; the verdict is read by a human.

set -u
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here/../../.."
: "${ANDREW_BDS_DIR:?set ANDREW_BDS_DIR to a private instance}"
export ANDREW_BDS_DIR
log=dist/bds-gametest.log
data="docker/$ANDREW_BDS_DIR/data"
probe=src/gametest/probe-look.ts
names=(probe_look_items probe_look_molang_product probe_look_molang_product_qc1 probe_look_molang_product_qc3 probe_look_molang_probe probe_look_molang_crossbow probe_look_molang_bow probe_look_dye)
[ -n "${LOOK_ONLY:-}" ] && read -r -a names <<< "$LOOK_ONLY"

for f in packs/gametest/entities/player.json packs/gametest/animation_controllers "$probe" src/gametest/main.ts.bak; do
  [ -e "$f" ] && { echo "$f already exists; this script would delete it on exit"; exit 1; }
done
[ -d "$data/behavior_packs" ] || { echo "$data/behavior_packs not found: the instance has no BDS install"; exit 1; }
[ -f dist/andrew.mcaddon ] || npm run build >/dev/null || exit 1

items=()
for f in "$here"/items/*.json "$here"/items-control/*.json; do
  dest="packs/gametest/items/$(basename "$f")"
  [ -e "$dest" ] && { echo "$dest already exists"; exit 1; }
  items+=("$dest")
done
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
restore() {
  rm -f "$probe" "${items[@]}"
  node "$here/player-molang.mjs" clean packs/gametest
  mv src/gametest/main.ts.bak src/gametest/main.ts
  mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs
}
trap restore EXIT

cp "$here/probe.ts" "$probe"
cp "$here"/items/*.json "$here"/items-control/*.json packs/gametest/items/
echo 'import "./probe-look";' >> src/gametest/main.ts
node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  fs.writeFileSync(f, s.replace(marker, marker + process.argv.slice(1).map((n) => `\n  "andrew:${n}",`).join("")));
' "${names[@]}" || exit 1
node "$here/player-molang.mjs" install "$data" packs/gametest || exit 1

echo "@minecraft/server $(node -p "require('./node_modules/@minecraft/server/package.json').version")"
npx tsc --noEmit -p . || exit 1
echo "tsc: probe compiles against the stable typings"

only=()
for n in "${names[@]}"; do only+=(--only "andrew:$n"); done
node scripts/bds-gametest.mjs "${only[@]}"
status=$?
grep -iE "probe_look|look_probe|andrew_lp|player\.json|molang|dyeable|minecraft:icon|attachable" "$log" | grep -v "\[probe\] LOOK" | sed 's/^/engine: /' | head -40
grep -E "\[probe\] LOOK" "$log" | sed 's/.*\[probe\] LOOK //'
results=$(grep -cE "\[probe\] LOOK .*RESULT" "$log")
echo "RESULT lines: $results of ${#names[@]}; runner exit $status"
[ "$status" -eq 0 ] && [ "$results" -eq "${#names[@]}" ]
