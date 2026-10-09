#!/usr/bin/env bash
# Storm Blade probe on BDS (docs/feedback/probe-storm.md, P1–P6).
#
#   env ANDREW_BDS_DIR=../dist/bds-strm packs/gametest/storm-probe/run.sh [scenario ...]
#
# For one run this script installs, and on exit removes:
#   - probe.ts as src/gametest/probe-storm.ts, imported from main.ts;
#   - its scenario names in EXPECTED_TESTS of scripts/bds-gametest.mjs.
# Nothing of this stays in the suite. ANDREW_BDS_DIR must name a private instance: a wave shares
# andrew-bds-ci, and bds / bds-qa are the servers people play on.
#
# Exit 0: every selected scenario passed and printed its RESULT line, and, when the particle
# scenario ran, its controls held: the made-up ids get the same server answer as the iPad-seen ones,
# no content-log line names either, the made-up ids are declared in no resource pack and every
# iPad-seen id is. The answers are the "[probe] STRM" lines, kept in dist/strm-probe.txt; the
# compact rows come last (a run-check artifact keeps only the tail).

set -u
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here/../../.."
case "${ANDREW_BDS_DIR:-}" in
  "" | bds | bds-ci | bds-qa)
    echo "ANDREW_BDS_DIR=${ANDREW_BDS_DIR:-} is shared; name a private instance under dist/ (e.g. ../dist/bds-strm)"
    exit 2
    ;;
esac
export ANDREW_BDS_DIR
log=dist/bds-gametest.log
out=dist/strm-probe.txt
data="docker/$ANDREW_BDS_DIR/data"
probe=src/gametest/probe-storm.ts
vanilla="$here/vanilla-particles-v1.26.50.4.txt"
names=(probe_strm_particles probe_strm_resistance_bare probe_strm_resistance_diamond probe_strm_mob
  probe_strm_crit_bare probe_strm_crit_diamond probe_strm_absorption probe_strm_totem probe_strm_credit
  probe_strm_knockback probe_strm_trace probe_strm_random)
[ $# -gt 0 ] && names=("$@")

for f in "$probe" src/gametest/main.ts.bak scripts/bds-gametest.mjs.bak; do
  [ -e "$f" ] && { echo "$f already exists; this script would delete it on exit"; exit 1; }
done
bin=$(ls "$data"/bedrock_server-* 2>/dev/null | head -1)
[ -n "$bin" ] || { echo "$data has no bedrock_server binary: the instance has no BDS install"; exit 1; }

cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
restore() {
  rm -f "$probe"
  mv src/gametest/main.ts.bak src/gametest/main.ts
  mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs
}
trap restore EXIT

cp "$here/probe.ts" "$probe"
echo 'import "./probe-storm";' >> src/gametest/main.ts
node -e '
  const fs = require("fs");
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  fs.writeFileSync(f, s.replace(marker, marker + process.argv.slice(1).map((n) => `\n  "andrew:${n}",`).join("")));
' probe_strm_particles probe_strm_resistance_bare probe_strm_resistance_diamond probe_strm_mob probe_strm_crit_bare \
  probe_strm_crit_diamond probe_strm_absorption probe_strm_totem probe_strm_credit probe_strm_knockback probe_strm_trace \
  probe_strm_random || exit 1

echo "@minecraft/server $(node -p "require('./node_modules/@minecraft/server/package.json').version"), BDS $(basename "$bin")"
npx tsc --noEmit -p . || exit 1
echo "tsc: probe compiles against the stable typings"

start=dist/.strm-probe-start
touch "$start"
only=()
for n in "${names[@]}"; do only+=(--only "andrew:$n"); done
node scripts/bds-gametest.mjs "${only[@]}"
status=$?

grep -E "\[probe\] STRM " "$log" | sed 's/.*\[probe\] STRM //' | tr -d '\r' > "$out"
fail=0
for n in "${names[@]}"; do
  grep -q "onTestPassed: andrew:$n" "$log" || { echo "FAIL: andrew:$n did not pass"; fail=1; }
  grep -q "^$n RESULT done" "$out" || { echo "FAIL: andrew:$n printed no RESULT line"; fail=1; }
done

p1=""
if grep -q "^PARTICLE role=" "$out"; then
  # One pass over the binary: every minecraft:… literal the server itself carries.
  literals=$(mktemp)
  LC_ALL=C grep -a -o -E 'minecraft:[a-z0-9_]+' "$bin" | sort -u > "$literals"
  contentlogs=$(find "$data" -maxdepth 1 -name 'ContentLog*' -newer "$start" 2>/dev/null)
  p1=$(
    printf '%s\n' "role id spawn3 /particle content-log server-binary vanilla-rp andrew-rp declared"
    grep "^PARTICLE role=" "$out" | while read -r _ role id spawn _ cmd; do
      role=${role#role=}; id=${id#id=}; spawn=${spawn#spawn3=}; cmd=${cmd#cmd=}
      # The id as a whole token: minecraft:spark must not count minecraft:sparkler_emitter.
      token="(^|[^a-z0-9_:])${id}([^a-z0-9_]|\$)"
      lines=0
      for c in "$log" $contentlogs; do lines=$((lines + $(grep -E -- "$token" "$c" | grep -vc "\[probe\]"))); done
      inbin=$(grep -cxF -- "$id" "$literals")
      inv=$(grep -cxF -- "$id" "$vanilla")
      inours=$(grep -lE "\"identifier\"[[:space:]]*:[[:space:]]*\"$id\"" packs/resource/particles/*.json 2>/dev/null | wc -l | tr -d ' ')
      decl=no
      [ "$inv" -gt 0 ] || [ "$inours" -gt 0 ] && decl=yes
      printf '%s\n' "$role $id $spawn $cmd $lines $inbin $inv $inours $decl"
    done
  )
  rm -f "$literals"
  # The server-side answer for each id; the made-up ids set the reference.
  ref=$(printf '%s\n' "$p1" | awk '$1 == "made-up" { print $3, $4, $5; exit }')
  while read -r role id spawn cmd lines _ _ _ decl; do
    [ "$role" = role ] && continue
    [ "$spawn $cmd $lines" = "$ref" ] || { echo "P1: $id answers '$spawn $cmd $lines', the made-up id '$ref': the server does tell them apart"; fail=1; }
    [ "$role" = made-up ] && [ "$decl" = yes ] && { echo "P1 CONTROL: made-up $id is declared"; fail=1; }
    [ "$role" = ipad-seen ] && [ "$decl" = no ] && { echo "P1 CONTROL: iPad-seen $id is declared nowhere"; fail=1; }
  done <<< "$p1"
fi

echo "--- full probe lines: $out ($(wc -l < "$out" | tr -d ' ') lines); runner exit $status"
grep -E "ERROR|NOISE [^n]" "$out" | cut -c1-300
grep -E "^TRACE " "$out" | cut -c1-420
grep -E "^(RANDOM|CREDIT doMobLoot)" "$out" | cut -c1-300
node "$here/p6-sample-size.mjs"
grep -E "^(SETUP|.* ARMOUR|MOB .* SETUP|CRIT .* SWEEP|PARTICLE CONTROL)" "$out" | cut -c1-300
grep -E "^KB .* ROW" "$out" | cut -c1-260
grep -E "^(TOTEM|CREDIT) ROW" "$out" | sed -E 's/ ev=\[[^]]*\]//' | cut -c1-360
grep -E "^(RES|MOB|CRIT|ABS) .* ROW" "$out" | cut -c1-420
[ -n "$p1" ] && printf '%s\n' "$p1" | column -t
[ "$status" -eq 0 ] && [ "$fail" -eq 0 ] && { echo "STRM probe: all selected scenarios passed, controls held"; exit 0; }
echo "STRM probe: FAILED (runner exit $status, checks fail=$fail)"
exit 1
