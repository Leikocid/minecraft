#!/usr/bin/env bash
# Re-measures every number of CX-L0-07 (L0-xcx7) and the facts its verdict rests on.
# Read-only. Exits 1 on the first measurement that differs from the report.
# KV and board are read from the root checkout: a worktree's .ai/context is a stale copy.
set -u
ROOT="${ROOT:-$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")}"
AIKIT="${AIKIT:-$(npm root -g)/@instinctools/ai-kit}"
N="$ROOT/.ai/context/analysis/nodes"
T="$ROOT/.ai/tasks"
L="$ROOT/.ai/logs"
fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS $1 = $3"; else echo "FAIL $1: expected $2, got $3"; fail=1; fi
}
count() { grep -o -E "$1" "${@:2}" 2>/dev/null | wc -l | tr -d ' '; }
files() { ls "$N"/$1-ac*__concept-acceptance-criterion.md 2>/dev/null | wc -l | tr -d ' '; }

echo "# M1 Windmill ACs carry the split"
check "wind-ac files" 17 "$(files wind)"
check "wind-ac verify:bds tags" 14 "$(cat "$N"/wind-ac*__concept-acceptance-criterion.md | count '"verify:bds"')"
check "wind-ac verify:ipad tags" 4 "$(cat "$N"/wind-ac*__concept-acceptance-criterion.md | count '"verify:ipad"')"

echo "# M2 Airship / Warden City / Bastion ACs carry no channel"
for c in airs:8 wrdn:10 bast:9; do
  id=${c%%:*}; n=${c##*:}
  check "$id-ac files" "$n" "$(files "$id")"
  check "$id-ac channel/verify tags" 0 "$(cat "$N"/$id-ac*__concept-acceptance-criterion.md | count '"(channel|verify):[a-z0-9]+"')"
  check "$id-ac words bds|ipad" 0 "$(cat "$N"/$id-ac*__concept-acceptance-criterion.md | grep -o -i -w -E 'bds|ipad' | wc -l | tr -d ' ')"
done

echo "# M3 'reads as' criteria in wrdn/bast ACs"
check "wrdn/bast ACs with 'reads as'" 1 "$(grep -l -i 'reads as' "$N"/wrdn-ac*__concept-acceptance-criterion.md "$N"/bast-ac*__concept-acceptance-criterion.md | wc -l | tr -d ' ')"
check "wrdn/bast ACs naming Ancient City/Bastion look" 0 "$(grep -l -i -E 'read(s)? as (a )?(compact )?(vanilla )?(ancient city|bastion)' "$N"/wrdn-ac*__concept-acceptance-criterion.md "$N"/bast-ac*__concept-acceptance-criterion.md | wc -l | tr -d ' ')"

echo "# M4 no infr node maps structure tests 24-59"
check "infr nodes citing tests 24-59" 0 "$(grep -l -E 'tests? ?(2[4-9]|[3-5][0-9])\b' "$N"/infr*.md | wc -l | tr -d ' ')"

echo "# M5 nothing reads a KV channel tag"
check "ai-kit $(grep -m1 '"version"' "$AIKIT/package.json" | grep -o -E '[0-9.]+') files reading verify:/channel: tags" 0 \
  "$(grep -rIl --exclude-dir=node_modules -E '(verify|channel):(ipad|bds)' "$AIKIT" 2>/dev/null | wc -l | tr -d ' ')"

echo "# M6 structure criteria on the board"
ids="WIND-TMPL-01-AA WIND-BODY-01-AA WIND-SPAWN-01-AA AIRS-TMPL-01-AA AIRS-BODY-01-AA AIRS-SHAPE-01-AA AIRS-SCALE-01-AA WRDN-TMPL-01-AA WRDN-BODY-01-AA WRDN-BIG-01-AA BAST-TMPL-01-AA BAST-BODY-01-AA DEMO-S4A-01-AA DEMO-S4-01-AA"
crit=""; for id in $ids; do crit+="$(grep -E '^\s*- \[[ x]\]' "$T/$id.md")"$'\n'; done
crit="$(printf '%s' "$crit" | sed '/^$/d')"
check "criteria in 14 structure tasks" 122 "$(printf '%s\n' "$crit" | wc -l | tr -d ' ')"
check "criteria without a type" 0 "$(printf '%s\n' "$crit" | grep -v -c '\[type:')"
check "type:manual" 16 "$(printf '%s\n' "$crit" | grep -c '\[type:manual\]')"
check "type:manual vstatus:accepted" 11 "$(printf '%s\n' "$crit" | grep '\[type:manual\]' | grep -c '\[vstatus:accepted\]')"
check "type:manual vstatus:verified" 5 "$(printf '%s\n' "$crit" | grep '\[type:manual\]' | grep -c '\[vstatus:verified\]')"
check "type:manual with an artifact, whole board" 0 "$(grep -h -E '^\s*- \[[ x]\]' "$T"/*.md | grep '\[type:manual\]' | grep -c '\[artifact:')"
check "DEMO-S2-AA manual criteria" 4 "$(grep -E '^\s*- \[[ x]\]' "$T/DEMO-S2-AA.md" | grep -c '\[type:manual\]')"
check "DEMO-S3-AA manual criteria" 4 "$(grep -E '^\s*- \[[ x]\]' "$T/DEMO-S3-AA.md" | grep -c '\[type:manual\]')"

echo "# M7 the executor itself closed each render criterion with true"
pos() { # log, 1-based position -> value at that position in each criteria_results array
  grep -o -E '"criteria_results":\[[^]]*\]' "$1" | sort -u | sed -E 's/^"criteria_results":\[//; s/\]$//' \
    | awk -F, -v p="$2" '{print $p}' | sort -u | tr '\n' ' ' | sed 's/ $//'
}
check "WRDN-BIG-01-AA submit, render position 6 (7-item) / 7 (8-item)" "true" \
  "$(grep -o -E '"criteria_results":\[[^]]*\]' "$L/agent-WRDN-BIG-01-AA.log" | sort -u \
    | sed -E 's/^"criteria_results":\[//; s/\]$//' | awk -F, '{print $(NF-1)}' | sort -u | tr -d '\n')"
check "AIRS-SHAPE-01-AA submit, render position 9" "true" "$(pos "$L/agent-AIRS-SHAPE-01-AA.log" 9)"
check "AIRS-SCALE-01-AA submit, render position 9" "true" "$(pos "$L/agent-AIRS-SCALE-01-AA.log" 9)"

echo "# M8 where ai-kit turns a non-null value into verified for manual criteria"
check "board.js: non-null -> verified" 1 "$(grep -c 'verification_status: r != null ? "verified" : undefined' "$AIKIT/dist/tasks/board.js")"
check "autopilot-verify.js: inspector verdict for non-exec" 1 "$(grep -c 'return verdict.criteriaResults\[i\];' "$AIKIT/dist/orchestrator/autopilot-verify.js")"

exit $fail
