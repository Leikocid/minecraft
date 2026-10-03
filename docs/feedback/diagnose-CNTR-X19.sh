#!/usr/bin/env bash
# CNTR-X19-AA / L0-xcx19: are the magnet's iPad checks still folded into GameTest criteria,
# and can any of them close without a person on the iPad?
# Reads the root checkout's KV and board (.ai/tasks is gitignored, so a worktree has no board).
set -u
ROOT="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
KV="$ROOT/.ai/context/analysis/nodes"
TASKS="$ROOT/.ai/tasks"
fail=0

check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS $1 = $3"; else echo "FAIL $1: expected $2, got $3"; fail=1; fi
}
count() { # pattern file — grep -c without the exit-1-on-zero
  local n; n=$(grep -c -E -- "$1" "$2" 2>/dev/null); echo "${n:-0}"
}

A04="$KV/magn-a04__concept-acceptance-criterion.md"
A07="$KV/magn-a07__concept-acceptance-criterion.md"
A14="$KV/magn-a14__concept-acceptance-criterion.md"
AIPD="$KV/magn-aipd__concept-acceptance-criterion.md"
X19="$KV/xcx19__concept-contradiction.md"

echo "# M1 KV text of the three criteria today"
for f in "$A04" "$A07" "$A14"; do
  n=$(basename "$f" __concept-acceptance-criterion.md)
  check "$n analysis_version" 5 "$(sed -n 's/^analysis_version: //p' "$f")"
  check "$n tag channel:bds" 1 "$(count '"channel:bds"' "$f")"
  check "$n tag channel:ipad" 0 "$(count 'channel:ipad' "$f")"
  check "$n trailing (ipad) clause" 0 "$(count '\(ipad\)' "$f")"
  check "$n pointer to L0-magn-aipd in body" 1 "$(count '^The iPad check .* is in `L0-magn-aipd`' "$f")"
  wt=".ai/context/analysis/nodes/$(basename "$f")"
  if cmp -s "$wt" "$f"; then echo "PASS $n worktree copy = root copy"; else echo "FAIL $n worktree copy differs from root"; fail=1; fi
done
check "magn-aipd tag channel:ipad" 1 "$(count '"channel:ipad"' "$AIPD")"
check "magn-aipd tag manual" 1 "$(count '"manual"' "$AIPD")"
check "magn-aipd tag resolves:L0-xcx19" 1 "$(count '"resolves:L0-xcx19"' "$AIPD")"
check "magn-aipd closing rule: no GameTest closes it" 1 "$(count 'No GameTest can close this criterion' "$AIPD")"
check "control: '(ipad)' pattern finds the clauses xcx19 quotes" 3 "$(count '\(ipad\)' "$X19")"
check "xcx19 analysis_version" 4 "$(sed -n 's/^analysis_version: //p' "$X19")"
check "xcx19 status:open" 1 "$(count '^status: open' "$X19")"

echo "# M2 the dual-channel text never reached git"
rel() { echo ".ai/context/analysis/nodes/$(basename "$1")"; }
for f in "$A04" "$A07" "$A14" "$AIPD" "$X19"; do
  check "$(basename "$f" .md) first commit" 0a8f2c1 "$(git log --format=%h --abbrev=7 --reverse -- "$(rel "$f")" | head -1)"
done
check "commits ever adding/removing '(ipad)' in a04/a07/a14" 0 \
  "$(git log --all --format=%h -S'(ipad)' -- "$(rel "$A04")" "$(rel "$A07")" "$(rel "$A14")" | wc -l | tr -d ' ')"

echo "# M3 live board: the GameTest criteria built from a04/a07/a14"
HOLD="$TASKS/MAGN-HOLD-01-AA.md"
check "MAGN-HOLD-01-AA status" done "$(sed -n 's/^status: "*\([a-z_]*\)"*/\1/p' "$HOLD")"
for id in a04 a07 a14; do
  line=$(grep -E "^\s*- \[.\].*\[src: L0-magn-$id" "$HOLD")
  check "MAGN-HOLD criterion [src L0-magn-$id] type" e2e "$(echo "$line" | sed -n 's/.*\[type:\([a-z0-9]*\)\].*/\1/p')"
  check "MAGN-HOLD criterion [src L0-magn-$id] says (bds)" 1 "$(echo "$line" | grep -c 'e2e (bds)')"
  check "MAGN-HOLD criterion [src L0-magn-$id] mentions ipad" 0 "$(echo "$line" | grep -c -i 'ipad')"
done
live_aipd=0
for f in "$TASKS"/*.md; do
  case "$(basename "$f")" in CNTR-X19-AA.md) continue ;; esac
  n=$(count '^\s*- \[.\].*L0-magn-aipd' "$f"); live_aipd=$((live_aipd + n))
done
check "live cards with a criterion citing L0-magn-aipd" 0 "$live_aipd"
dual() { grep -i 'ipad' | grep -v -c '\[type:manual\]'; }
check "control: live criteria citing L0-magn-* (MAGN-SCAN 7 + MAGN-HOLD 6)" 13 \
  "$(grep -h -E '^\s*- \[.\].*L0-magn-' "$TASKS"/*.md | wc -l | tr -d ' ')"
check "control: a synthetic dual-channel line is caught" 1 \
  "$(echo '  - [x] e2e (bds): rise; (ipad) looks smooth [src: L0-magn-a04] [type:e2e]' | dual)"
check "live dual-channel magnet criteria (cite magn-* and say ipad, type not manual)" 0 \
  "$(grep -h -E '^\s*- \[.\].*L0-magn-' "$TASKS"/*.md | dual)"

echo "# M4 the separate iPad card"
UFO="$TASKS/archive/UFO-IPAD-01-AA.md"
if [ -f "$TASKS/UFO-IPAD-01-AA.md" ]; then echo "FAIL UFO-IPAD-01-AA is on the live board"; fail=1; else echo "PASS UFO-IPAD-01-AA not on the live board"; fi
check "UFO-IPAD-01-AA in archive" 1 "$([ -f "$UFO" ] && echo 1 || echo 0)"
check "UFO-IPAD-01-AA status" rejected "$(sed -n 's/^status: "*\([a-z_]*\)"*/\1/p' "$UFO")"
check "UFO-IPAD-01-AA rejection_origin" decision "$(sed -n 's/^rejection_origin: "*\([a-z_]*\)"*/\1/p' "$UFO")"
check "UFO-IPAD-01-AA criteria citing L0-magn-aipd" 2 "$(count '^\s*- \[.\].*L0-magn-aipd' "$UFO")"
check "  of them type:manual" 2 "$(grep -E '^\s*- \[.\].*L0-magn-aipd' "$UFO" | grep -c '\[type:manual\]')"
check "  of them open [ ]" 2 "$(grep -E '^\s*- \[ \].*L0-magn-aipd' "$UFO" | wc -l | tr -d ' ')"
check "  of them vstatus:verified" 0 "$(grep -E '^\s*- \[.\].*L0-magn-aipd' "$UFO" | grep -c 'vstatus:verified')"
check "UFO-IPAD-01-AA manual criteria open (all four)" 4 "$(grep -E '^\s*- \[ \].*\[type:manual\]' "$UFO" | wc -l | tr -d ' ')"

echo "# M5 the check sheet and the branches"
check "docs/demo/ufo-ipad.md lines citing L0-magn-aipd" 3 "$(count 'L0-magn-aipd' docs/demo/ufo-ipad.md)"
check "96ff1727 is an ancestor of HEAD" yes "$(git merge-base --is-ancestor 96ff1727 HEAD && echo yes || echo no)"
check "task/UFO-IPAD-01-AA merged into epic/stage6-ufo-demo" no \
  "$(git merge-base --is-ancestor task/UFO-IPAD-01-AA epic/stage6-ufo-demo && echo yes || echo no)"
check "epic/stage6-ufo-demo head = its base aab0ed9" aab0ed9 "$(git rev-parse --short=7 epic/stage6-ufo-demo)"

echo "# M6 sideways: the Cannon's iPad card"
ORBC="$TASKS/ORBC-IPAD-01-AA.md"
check "ORBC-IPAD-01-AA status" review "$(sed -n 's/^status: "*\([a-z_]*\)"*/\1/p' "$ORBC")"
check "ORBC-IPAD-01-AA open manual criteria" 7 "$(grep -E '^\s*- \[ \].*\[type:manual\]' "$ORBC" | wc -l | tr -d ' ')"

[ "$fail" = 0 ] && echo "ALL PASS" || echo "SOME FAILED"
exit "$fail"
