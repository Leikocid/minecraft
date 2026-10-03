#!/usr/bin/env bash
# CNTR-X20-AA: measures what L0-xcx20 claims ("L0-ufoc is missing from run v4;
# UFO AC-1, AC-2 timing, AC-3, AC-17, AC-18 have no owner") against today.
# Reads the main checkout's .ai (state, context, index, verify) read-only; writes nothing.
# Section 4 is a finding, not a gate: the KV index serves no current L0-ufoc artifact.
set -u
cd "$(git rev-parse --show-toplevel)"
ROOT="${ANDREW_ROOT:-$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)}"
STATE="$ROOT/.ai/state/analyst-state.md"
NODES="$ROOT/.ai/context/analysis/nodes"
DB="$ROOT/.ai/index/vectors.db"
VERIFY="$ROOT/.ai/verify"
echo "root .ai read from: $ROOT"

pass=0
fail=0
ok() { echo "PASS $*"; pass=$((pass + 1)); }
no() { echo "FAIL $*"; fail=$((fail + 1)); }
expect() { # expect <label> <file> <regex>
  local hit
  hit=$(grep -nE "$3" "$2" | head -1)
  if [ -n "$hit" ]; then ok "$1 — ${2#"$ROOT/"}:${hit%%:*}"; else no "$1 — not in ${2#"$ROOT/"}"; fi
}
q() { sqlite3 -readonly "file:$DB?mode=ro" "$1"; }

echo "== 1. node version (analyst-state, not the node text)"
expect "L0-ufoc current version is 5" "$STATE" '^  L0-ufoc: 5$'
expect "v4 promotion recorded ufoc as never analysed" "$STATE" 'promoted L0 \(v3 → v4\).*never analysed: L0-ufoc'
expect "ufoc promoted v3 → v5 on 2026-10-02" "$STATE" '2026-10-02 19:11 — promoted L0-ufoc \(v3 → v5\)'

echo "== 2. node artifacts on disk"
files=$(ls "$NODES" | grep -c '^ufoc')
v5=$(grep -l '^analysis_version: 5$' "$NODES"/ufoc* | wc -l | tr -d ' ')
acs=$(ls "$NODES" | grep -c '^ufoc-ac0')
echo "     ufoc* files: $files, at analysis_version 5: $v5, acceptance criteria: $acs"
if [ "$files" -gt 0 ] && [ "$files" -eq "$v5" ]; then ok "every ufoc artifact is v5 ($files)"; else no "ufoc artifacts: $files files, $v5 at v5"; fi
if [ "$acs" -eq 8 ]; then ok "ufoc-ac01…ac08 exist"; else no "ufoc ACs: $acs"; fi
for pair in "ac01:ufo-ac-1" "ac02:ufo-ac-1" "ac03:ufo-ac-17" "ac04:ufo-ac-2" "ac05:ufo-ac-3" "ac05:ufo-ac-18" "ac06:ufo-ac-17"; do
  expect "ufoc-${pair%%:*} carries tag ${pair#*:}" "$NODES/ufoc-${pair%%:*}__concept-acceptance-criterion.md" "\"${pair#*:}\""
done
expect "the v5 node cites the three inputs xcx20 asked for" "$NODES/ufoc__concept-component.md" 'L0-adr-ufpc.*L0-adr-ufht.*L0-xasm17|L0-adr-ufom.*L0-adr-ufpc.*L0-adr-ufht.*L0-xasm13.*L0-xasm14.*L0-xasm17'

echo "== 3. the board's work (git trailers of the closing commit)"
if git merge-base --is-ancestor aef4d54 HEAD; then ok "aef4d54 (closes UFOC-CORE-01-AA) is in HEAD"; else no "aef4d54 not in HEAD"; fi
git show -s --format=%B aef4d54 | grep -E '^(Type|Tasks|Verified-By|Acceptance):' | sed 's/^/     /'
if git show -s --format=%B aef4d54 | grep -qx 'Acceptance: passed=9 failed=0'; then ok "UFOC-CORE-01-AA closed 9/9"; else no "UFOC-CORE-01-AA trailer not 9/9"; fi

echo "== 4. FINDING (not gated): what the KV index serves for L0-ufoc"
cur=$(q "select count(*) from kv_documents where node_id like 'L0-ufoc%' and closed_reason is null;")
closed=$(q "select count(*)||' closed as '||group_concat(distinct closed_reason)||' at '||group_concat(distinct closed_at) from kv_documents where node_id like 'L0-ufoc%';")
batch=$(q "select count(*) from kv_documents where closed_at='2026-10-03T15:11:04.299Z';")
v6=$(q "select count(*) from kv_documents where source_channel='rollout' and closed_reason is null and analysis_version=6;")
low=$(q "select count(*) from kv_documents where source_channel='rollout' and closed_reason is null and analysis_version<6;")
echo "     L0-ufoc current in the index: $cur; $closed"
echo "     docs closed in the 15:11:04.299Z batch: $batch; current rollout docs: v6 $v6, below v6 $low"

echo "== 5. owner in code, per named UFO criterion"
echo "-- AC-1: first arrival 10–20 min after the first join"
expect "window 600 000…1 200 000 ms" src/ufo/env.ts 'FIRST_MIN_MS = 600_000'
expect "window upper bound" src/ufo/env.ts 'FIRST_MAX_MS = 1_200_000'
expect "first join wired from playerSpawn.initialSpawn" src/ufo/index.ts 'if \(event\.initialSpawn\) core\.firstJoin\(\)'
expect "GameTest asserts join + FIRST_MAX_MS" src/gametest/ufo-core.ts 'first === join \+ FIRST_MAX_MS'
echo "-- AC-1: next exactly 15 min after a departure or a shot"
expect "PAUSE_MS = 15 min" src/ufo/env.ts 'PAUSE_MS = 900_000'
expect "every end path moves next_ms (a shot keeps its own)" src/ufo/event.ts 's\.downedHandled \? this\.schedule\.next\(\) : this\.schedule\.pauseFromNow\(\)'
expect "GameTest: +15 min after the departure" src/gametest/ufo-core.ts 'r\.next\(\) === end1\.now \+ PAUSE_MS'
expect "GameTest: +15 min after the shot" src/gametest/ufo-core.ts 'r\.next\(\) === shotAt \+ PAUSE_MS'
echo "-- AC-1: the timer survives a restart"
expect "in-flight marker 0" src/ufo/schedule.ts 'IN_FLIGHT = 0'
expect "bds-check self-check: timer" src/selftest/ufo-restart.ts 'check\("timer"'
expect "bds-check self-check: in-flight marker" src/selftest/ufo-restart.ts 'check\("in-flight marker"'
echo "-- AC-2 timing: 20 / 60 / 15 s"
expect "PHASE_TICKS 400/1200/300" src/ufo/env.ts 'arrival: 400, magnet: 1200, departure: 300'
expect "GameTest asserts arrival 400 ± 1" src/gametest/ufo-core.ts 'magnet\.tick - arrival\.tick - 400\) <= 1'
expect "GameTest asserts magnet 1200 ± 1" src/gametest/ufo-core.ts 'release\.tick - magnet\.tick - 1200\) <= 1'
expect "GameTest asserts departure 300 ± 1" src/gametest/ufo-core.ts 'pause\.tick - departure\.tick - 300\) <= 1'
expect "hoverY = min(centre + 40, ceiling − 15)" src/ufo/event.ts 'return Math\.min\(centreY \+ HOVER_ABOVE, ceiling - CEILING_MARGIN\)'
expect "CEILING_MARGIN = 15" src/ufo/event.ts 'CEILING_MARGIN = 15;'
echo "-- AC-3: Overworld only, waits for an Overworld player, one saucer; 150-block notice"
expect "candidates are Overworld players only" src/ufo/env.ts 'export function overworldCandidates'
expect "GameTest: the Nether and the End start nothing" src/gametest/ufo-core.ts 'an arrival started with the only player in'
expect "GameTest: the End is one of the cases" src/gametest/ufo-core.ts '\["the End", world\.getDimension\("the_end"\)'
expect "GameTest: one saucer in all dimensions" src/gametest/ufo-core.ts 'saucersEverywhere\(\) === 1'
expect "NOTICE_RANGE = 150" src/ufo/event.ts 'NOTICE_RANGE = 150;'
expect "GameTest: 151 blocks out gets nothing" src/gametest/ufo-core.ts '151 blocks out, got the notice'
expect "RU string" packs/resource/texts/ru_RU.lang '^andrew\.ufo\.arrival=В небе НЛО!$'
expect "EN string" packs/resource/texts/en_US.lang '^andrew\.ufo\.arrival=A UFO is in the sky!$'
echo "-- AC-17: operator-only commands; disable persists"
expect "registered at GameDirectors" src/ufo/commands.ts 'permissionLevel: api\.CommandPermissionLevel\.GameDirectors'
expect "script-side refusal below GameDirectors" src/ufo/commands.ts 'if \(belowOperator\(origin, api\.CommandPermissionLevel\.GameDirectors\)\)'
expect "GameTest: a guest's command never reaches the core" src/gametest/ufo-core.ts "a non-operator's command reached the core"
expect "GameTest: disable stores the flag" src/gametest/ufo-core.ts 'disable did not store the flag'
expect "bds-check: the release pack's disable/enable survives the restart" scripts/bds-check.mjs "the previous run's /andrew:ufo did not persist"
expect "bds-check self-check: disabled core starts nothing" src/selftest/ufo-restart.ts '"disabled",'
echo "-- AC-18: no saucer after a mid-event restart"
expect "worldLoad sweep" src/ufo/event.ts 'worldLoaded\(\): void'
expect "entityLoad sweep (L0-xasm17)" src/ufo/event.ts 'entityLoaded\(entity: Entity\): void'
expect "bds-check self-check: no saucer at load" src/selftest/ufo-restart.ts 'check\("no saucer at load"'
expect "bds-check self-check: no saucer after its chunk loads" src/selftest/ufo-restart.ts 'no saucer after its chunk loads'
expect "bds-check fails when ufo-restart did not run" scripts/bds-check.mjs '`ufo-restart-run\$\{i \+ 1\}`'
echo "-- the runner runs all six core scenarios"
for t in ufo_schedule_scaled_clock ufo_phases_real_durations ufo_overworld_only ufo_commands_operator ufo_arrival_notice ufo_idle_budget; do
  expect "runner list: $t" scripts/bds-gametest.mjs "'andrew:$t'"
done

echo "== 6. the last green proofs still describe HEAD"
paths="src/ufo src/gametest/ufo-core.ts src/selftest scripts/bds-check.mjs packs"
if git diff --quiet 27a2f01 HEAD -- $paths; then ok "UFO code, tests, self-check and bds-check unchanged since 27a2f01 (last full suite)"; else no "changed since 27a2f01: $(git diff --name-only 27a2f01 HEAD -- $paths | tr '\n' ' ')"; fi
runner=$(git diff -U0 27a2f01 HEAD -- scripts/bds-gametest.mjs | grep -E '^[-+][^-+]' )
echo "     runner lines changed since 27a2f01 ($(git log --format=%h 27a2f01..HEAD -- scripts/bds-gametest.mjs | tr '\n' ' ')):"
echo "$runner" | sed 's/^/       /'
if echo "$runner" | grep -qiE 'ufo|^-'; then no "the runner change since 27a2f01 touches UFO or removes a line"; else ok "the runner change since 27a2f01 only adds non-UFO tests"; fi
since=$(git log --format=%h 00d38cf..HEAD -- src/ufo/schedule.ts src/ufo/event.ts src/ufo/commands.ts src/ufo/env.ts src/gametest/ufo-core.ts src/selftest/ufo-restart.ts | tr '\n' ' ')
echo "     commits touching the core files since 00d38cf (UFOC-CORE-01-AA proof): ${since:-none}"
artifact() { # artifact <file> <label> <grep -c pattern> <min hits>
  local f="$VERIFY/$1" n code sha
  [ -f "$f" ] || { no "$2 — $1 missing"; return; }
  read -r code sha n < <(python3 - "$f" "$3" <<'PY'
import json, re, sys
d = json.load(open(sys.argv[1]))
print(d.get("exit_code"), (d.get("code_sha") or "")[:7], len(re.findall(sys.argv[2], d.get("stdout_tail", ""))))
PY
)
  if [ "$code" = "0" ] && [ "$n" -ge "$4" ]; then ok "$2 — $1: exit 0 at $sha, $n match(es)"; else no "$2 — $1: exit $code at $sha, $n match(es)"; fi
}
artifact SAUC-SHOOT-01-AA/2.json "full GameTest suite passes the six ufo core scenarios" 'onTestPassed: andrew:ufo_(schedule_scaled_clock|phases_real_durations|overworld_only|commands_operator|arrival_notice|idle_budget)' 6
artifact CNTR-X17-AA/2.json "bds-check with the UFO restart phases at HEAD" '\[andrew\] ufo ufo: loaded, enabled=' 3
if python3 -c "import json,sys; sys.exit(0 if json.load(open(sys.argv[1]))['code_sha'].startswith(sys.argv[2]) else 1)" "$VERIFY/CNTR-X17-AA/2.json" "$(git rev-parse HEAD)"; then ok "that bds-check ran at HEAD $(git rev-parse --short HEAD)"; else no "CNTR-X17-AA/2.json is not at HEAD"; fi

echo "== 7. unit owner of the schedule, run now"
if node --test tests/ufo-schedule.test.mjs >/tmp/cntr-x20-unit.log 2>&1; then ok "tests/ufo-schedule.test.mjs: $(grep -E '^ℹ (pass|fail) ' /tmp/cntr-x20-unit.log | tr '\n' ' ')"; else no "tests/ufo-schedule.test.mjs: $(tail -5 /tmp/cntr-x20-unit.log | tr '\n' ' ')"; fi

echo
echo "RESULT: $pass PASS, $fail FAIL"
[ "$fail" -eq 0 ]
