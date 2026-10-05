#!/usr/bin/env bash
# CX-lgnd-15 checks: who holds which keyPrefix, and what the registry does with
# a def #5 that reuses the Scythe's.
#
#   search      prefix occupancy in the registry, the shipped release bundles and
#               every tracked file outside .ai. Exit 0 when `sc` is held by the
#               Scythe alone and no `andrew:sk_` key or `sk` prefix exists.
#   keys        keysFor() of a crossbow def with `sc` and with `sk`, against the
#               Scythe's. Exit 0 when `sc` shares all nine keys and the gen
#               ledger, and `sk` shares none.
#   dup <pfx>   appends a crossbow def #5 with keyPrefix <pfx> (every other field
#               unique) to LEGENDARIES, runs `npm test`, restores registry.ts.
#               Exit 1 when the uniqueness test fails with "duplicate keyPrefix",
#               0 when it passes. Other failures come from the incomplete fixture
#               (no recipe, lang, four-weapon tables) and do not count.
#
# Exit 3: the probe itself failed, so the answer is not a measurement.

set -u
cd "$(dirname "$0")/../.."
REG=src/legendary/registry.ts

search() {
  local bad=0
  echo "--- registry prefixes"
  grep -nE 'keyPrefix: "' "$REG"
  local holders
  holders=$(grep -cE 'keyPrefix: "sc"' "$REG")
  [ "$holders" = 1 ] && grep -B1 -nE 'keyPrefix: "sc"' "$REG" | grep -q 'scythe_of_calamity' || { echo "sc is not held by the Scythe alone"; bad=1; }
  grep -qE 'keyPrefix: "sk"' "$REG" && { echo "sk is already taken"; bad=1; }
  echo "--- shipped bundles: keyPrefix sc / sk"
  for f in releases/*.mcaddon; do
    printf '%s: %s\n' "$f" "$(unzip -p "$f" behavior/scripts/main.js 2>/dev/null | grep -nE -B2 'keyPrefix: "(sc|sk)"' | grep -oE '(itemId: "[^"]+"|keyPrefix: "(sc|sk)")' | tr '\n' ' ')"
  done
  echo "--- andrew:sc_ literals in tracked files outside .ai"
  git grep -n 'andrew:sc_' -- . ':!.ai' ':!docs/feedback/diagnose-CNTR-LGND-CX15*' || echo "(none)"
  echo "--- derived Scythe keys (keysFor/genLedgerKey of SCYTHE_OF_CALAMITY, prefix asserts)"
  git grep -nE '(keysFor|genLedgerKey)\(\s*SCYTHE|SCYTHE_OF_CALAMITY\.keyPrefix' -- src tests || echo "(none)"
  echo "--- andrew:sk_ / sk_ keys / \"sk\" in tracked files outside .ai"
  if git grep -nE 'andrew:sk_|\bsk_(origin|owner|id|crafted|pending|gen|owed)|["'"'"'`]sk["'"'"'`]' -- . ':!.ai' ':!docs/feedback/diagnose-CNTR-LGND-CX15*'; then
    bad=1
  else
    echo "(none)"
  fi
  return $bad
}

keys() {
  node --input-type=module -e '
import { build } from "esbuild";
const out = await build({ entryPoints: ["src/legendary/registry.ts"], bundle: true, format: "esm", platform: "neutral", write: false, external: ["@minecraft/server"] });
const m = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
const scythe = m.keysFor(m.SCYTHE_OF_CALAMITY);
const shipped = new Set(m.LEGENDARIES.flatMap((d) => Object.values(m.keysFor(d))));
const result = {};
for (const pfx of ["sc", "sk"]) {
  const crossbow = { ...m.SCYTHE_OF_CALAMITY, itemId: "andrew:sculk_crossbow", keyPrefix: pfx };
  const k = m.keysFor(crossbow);
  const shared = Object.keys(k).filter((n) => k[n] === scythe[n]).map((n) => k[n]);
  const gen = m.genLedgerKey(crossbow, "X") === m.genLedgerKey(m.SCYTHE_OF_CALAMITY, "X");
  const clash = Object.values(k).filter((v) => shipped.has(v)).length;
  result[pfx] = { shared: shared.length, gen, clash };
  console.log(`${pfx}: shares ${shared.length}/9 Scythe keys [${shared.join(", ")}]; gen ledger shared: ${gen}; clashes with any shipped def: ${clash}`);
}
const ok = result.sc.shared === 9 && result.sc.gen && result.sk.shared === 0 && !result.sk.gen && result.sk.clash === 0;
process.exit(ok ? 0 : 1);
' || return $?
}

dup() {
  local pfx="$1" backup rc
  backup=$(mktemp)
  cp "$REG" "$backup"
  trap 'cp "$backup" "$REG"' EXIT
  node -e '
const fs = require("fs");
const [f, pfx] = process.argv.slice(1);
const src = fs.readFileSync(f, "utf8");
const from = "[WEB_SWORD, SCYTHE_OF_CALAMITY, ORBITAL_CANNON, DRAGON_KATANA]";
if (!src.includes(from)) { console.error("LEGENDARIES anchor not found"); process.exit(3); }
const def = `{ itemId: "andrew:sculk_crossbow", keyPrefix: "${pfx}", abilityKey: "sculk_crossbow", nameKey: "item.andrew:sculk_crossbow", cooldownTicks: 0, craftGate: true, craftTokenId: "andrew:sculk_crossbow_crafted", refund: [["minecraft:echo_shard", 2], ["minecraft:deepslate", 2], ["minecraft:crossbow", 1]], textPrefix: "andrew.crossbow", command: "andrew:crossbow" }`;
fs.writeFileSync(f, src.replace(from, from.slice(0, -1) + ", " + def + "]"));
' "$REG" "$pfx" || return 3
  echo "--- injected def #5 with keyPrefix \"$pfx\""
  local log
  log=$(mktemp)
  npm test >"$log" 2>&1
  rc=$?
  cp "$backup" "$REG"
  trap - EXIT
  git diff --quiet -- "$REG" || { echo "registry.ts not restored"; return 3; }
  echo "--- registry.ts restored; npm test exit=$rc"
  grep -E '^ℹ (tests|pass|fail)' "$log"
  echo "--- failing tests"
  grep -E '^\s*✖' "$log" | sed -E 's/ \([0-9.]+ms\)$//' | sort -u
  grep -E 'AssertionError.*duplicate' "$log" | sort -u
  if grep -qE '✖ item ids, prefixes and ability keys are unique across the registry' "$log"; then
    grep -qE 'AssertionError.*duplicate keyPrefix' "$log" || { echo "uniqueness failed for another field"; return 3; }
    echo "VERDICT: uniqueness test RED — duplicate keyPrefix \"$pfx\""
    return 1
  fi
  grep -qE '✔ item ids, prefixes and ability keys are unique across the registry' "$log" || { echo "uniqueness test did not run"; return 3; }
  echo "VERDICT: uniqueness test green for keyPrefix \"$pfx\""
  return 0
}

case "${1:-}" in
  search) search ;;
  keys) keys ;;
  dup) [ -n "${2:-}" ] || { echo "usage: $0 dup <prefix>"; exit 3; }; dup "$2" ;;
  *) echo "usage: $0 search | keys | dup <prefix>"; exit 3 ;;
esac
