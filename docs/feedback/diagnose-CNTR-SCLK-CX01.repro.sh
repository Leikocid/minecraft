#!/usr/bin/env bash
# CX-sclk-01 check on BDS: can Piercing get onto an item with
# `minecraft:enchantable.slot = "crossbow"`, and does the strip L0-adr-scpi
# prescribes take it off again while keeping the other enchantments?
#
# Exit 0: the KV's Source B holds — the engine admits piercing on the custom item
#         (canAddEnchantment, /enchant, enchant_with_levels), and every strip case
#         reads no piercing and still reads quick_charge/unbreaking by +1 tick.
# Exit 1: one of those is false — the contradiction reads differently.
# Exit 2: no verdict (the build or run failed, a probe item or table did not load,
#         or a control misbehaved).
#
# The probe is not part of the shipped gametest pack: this script copies it, the
# two probe items and the loot tables into the tree for one run and restores
# main.ts, bds-gametest.mjs and packs/gametest on exit. ANDREW_BDS_DIR picks the
# BDS instance (default bds-ci); agents of one wave share andrew-bds-ci, so give
# each a copy with its own container name and ports.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log
probe=src/gametest/probe-sclk-cx01.ts
fixture=docs/feedback/diagnose-CNTR-SCLK-CX01.pack
tests=(andrew:probe_sclk_cx01_engine andrew:probe_sclk_cx01_tables andrew:probe_sclk_cx01_command andrew:probe_sclk_cx01_strip)

restore() {
  rm -f "$probe"
  rm -rf packs/gametest/items packs/gametest/loot_tables
  mv src/gametest/main.ts.bak src/gametest/main.ts
  mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs
}
[ -e packs/gametest/items ] || [ -e packs/gametest/loot_tables ] && { echo "packs/gametest already has items/ or loot_tables/"; exit 2; }
cp docs/feedback/diagnose-CNTR-SCLK-CX01.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap restore EXIT
cp -R "$fixture/items" "$fixture/loot_tables" packs/gametest/

echo 'import "./probe-sclk-cx01";' >> src/gametest/main.ts
node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  const names = process.argv.slice(1).map((n) => `\n  "${n}",`).join("");
  fs.writeFileSync(f, s.replace(marker, marker + names));
' "${tests[@]}" || exit 2

d=node_modules/@minecraft/server
echo "@minecraft/server $(node -p "require('./$d/package.json').version")"
npx tsc --noEmit -p . || exit 2
echo "tsc: probe compiles against the stable typings"

only=()
for t in "${tests[@]}"; do only+=(--only "$t"); done
node scripts/bds-gametest.mjs "${only[@]}" || exit 2
grep -E "\[probe\] SCLK" "$log" | sed 's/.*\[probe\] //' | tr -d '\r'

line() { grep -E "\[probe\] SCLK $1 RESULT" "$log" | tr -d '\r' | head -1; }
fail=0
no_verdict=0
need() { # label, grep pattern, line
  if [ -z "$3" ]; then echo "NO LINE: $1"; no_verdict=1; return; fi
  if echo "$3" | grep -qE "$2"; then echo "ok: $1"; else echo "NOT: $1"; fail=1; fi
}
control() {
  if [ -z "$3" ]; then echo "NO LINE: $1"; no_verdict=1; return; fi
  if echo "$3" | grep -qE "$2"; then echo "control ok: $1"; else echo "CONTROL BROKEN: $1"; no_verdict=1; fi
}

grep -qE "\[probe\] SCLK (ENGINE|TABLE) .* RESULT missing" "$log" && { echo "a probe item or loot table did not load"; no_verdict=1; }

control "vanilla crossbow accepts piercing (engine)" "piercing1=true piercing4=true" "$(line "ENGINE minecraft:crossbow")"
control "web sword refuses piercing (engine)" "piercing1=false" "$(line "ENGINE andrew:web_sword")"
control "vanilla crossbow gets piercing from enchant_with_levels 30" "with_piercing=[1-9]" "$(line "TABLE ewl30_vanilla")"
control "web sword never gets piercing from enchant_with_levels 30" "with_piercing=0 " "$(line "TABLE ewl30_sword")"
control "/enchant refuses piercing on the web sword" "after=andrew:web_sword\[none\]" "$(line "COMMAND sword_piercing1")"

need "custom slot-crossbow item accepts piercing (engine)" "piercing1=true piercing4=true quick_charge3=true multishot1=true" "$(line "ENGINE andrew:probe_sclk_xbow")"
need "custom item without shooter accepts piercing (engine)" "piercing1=true piercing4=true" "$(line "ENGINE andrew:probe_sclk_plain")"
need "enchant_with_levels 30 puts piercing on the custom item" "with_piercing=[1-9]" "$(line "TABLE ewl30_xbow")"
need "/enchant puts piercing 4 on the custom item" "after=andrew:probe_sclk_xbow\[piercing4\]" "$(line "COMMAND xbow_piercing4")"
for c in addItem_xbow setItem_slot20_xbow pickup_xbow chest_transfer_xbow enchant_in_place_xbow addItem_vanilla; do
  l="$(line "STRIP $c")"
  # the sample 20 ticks after the put: the stack is there, without piercing, with what it had besides
  need "strip $c lands and keeps the rest" "\+20=slot[0-9]+:[a-z_:]+\[[a-z_0-9+]*\]" "$l"
  echo "$l" | grep -qE "\+20=[^ ]*piercing" && { echo "NOT: strip $c — piercing still there at +20"; fail=1; }
done

[ "$no_verdict" -ne 0 ] && exit 2
[ "$fail" -ne 0 ] && exit 1
exit 0
