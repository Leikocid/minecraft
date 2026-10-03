#!/usr/bin/env bash
# CNTR-X17-AA: measures what L0-xcx17 claims about UFO verification, from the code.
# Every line is a measurement with its address. The last gate is the gap itself:
# no UFO restart scenario runs inside the GameTest suite, so it exits 1 today.
set -u
cd "$(git rev-parse --show-toplevel)"

pass=0
fail=0
ok() { echo "PASS $*"; pass=$((pass + 1)); }
no() { echo "FAIL $*"; fail=$((fail + 1)); }
has() { grep -nE "$2" "$1" | head -1; }
expect() { # expect <label> <file> <regex>
  local hit
  hit=$(has "$2" "$3")
  if [ -n "$hit" ]; then ok "$1 — $2:${hit%%:*}"; else no "$1 — not in $2"; fi
}

echo "== 1. clock seam (L0-xasm13, L0-ufoc-ad01)"
expect "env.now() is the core's clock" src/ufo/env.ts 'now\(\): number;'
expect "the duration table is part of the env" src/ufo/env.ts 'readonly durations: UfoDurations;'
expect "product binds Date.now" src/ufo/env.ts 'now: \(\) => Date\.now\(\),'
expect "product binds the spec phases 400/1200/300" src/ufo/env.ts 'arrival: 400, magnet: 1200, departure: 300'
n=$(grep -cE 'Date\.now\(\)' src/ufo/event.ts src/ufo/schedule.ts | awk -F: '{s += $2} END {print s}')
n_code=$(grep -E 'Date\.now\(\)' src/ufo/event.ts src/ufo/schedule.ts | grep -vcE '^\S+:\s*(/\*\*|//|\*)')
echo "     Date.now() lines in event.ts + schedule.ts: $n (outside comments: $n_code)"
if [ "$n_code" -eq 0 ]; then ok "the core reads time only through env.now()"; else no "the core reads Date.now() directly ($n_code)"; fi
expect "the phase machine reads env.durations" src/ufo/event.ts 'const D = this\.env\.durations;'

echo "== 2. GameTest: time-span ACs (UFO AC-1 timing, AC-2 timing)"
expect "scaled-clock scenario registered" src/gametest/ufo-core.ts 'registerAsync\("andrew", "ufo_schedule_scaled_clock"'
expect "scaled-clock scenario runs on SHORT phases" src/gametest/ufo-core.ts 'rig\(\{ durations: SHORT, random: \(\) => 1 \}\)'
expect "the test clock is test-owned" src/gametest/ufo-core.ts 'class TestClock'
expect "first window asserted at join + FIRST_MAX_MS" src/gametest/ufo-core.ts 'first === join \+ FIRST_MAX_MS'
expect "+15 min after the departure asserted" src/gametest/ufo-core.ts 'r\.next\(\) === end1\.now \+ PAUSE_MS'
expect "+15 min after the shot asserted" src/gametest/ufo-core.ts 'r\.next\(\) === shotAt \+ PAUSE_MS'
expect "real-duration scenario registered" src/gametest/ufo-core.ts 'registerAsync\("andrew", "ufo_phases_real_durations"'
expect "real-duration scenario runs on PHASE_TICKS" src/gametest/ufo-core.ts 'rig\(\{ durations: PHASE_TICKS'
expect "arrival 400 ± 1 asserted" src/gametest/ufo-core.ts 'magnet\.tick - arrival\.tick - 400\) <= 1'
expect "magnet 1200 ± 1 asserted" src/gametest/ufo-core.ts 'release\.tick - magnet\.tick - 1200\) <= 1'
expect "departure 300 ± 1 asserted" src/gametest/ufo-core.ts 'pause\.tick - departure\.tick - 300\) <= 1'
expect "the runner runs the scaled-clock scenario" scripts/bds-gametest.mjs "'andrew:ufo_schedule_scaled_clock'"
expect "the runner runs the real-duration scenario" scripts/bds-gametest.mjs "'andrew:ufo_phases_real_durations'"

echo "== 3. restart ACs (UFO AC-1 restart half, AC-17 persistence, AC-18) — bds-check self-check"
expect "restart self-check: timer case" src/selftest/ufo-restart.ts 'check\("timer"'
expect "restart self-check: in-flight marker case" src/selftest/ufo-restart.ts 'check\("in-flight marker"'
expect "restart self-check: no saucer after its chunk loads" src/selftest/ufo-restart.ts 'no saucer after its chunk loads'
expect "restart self-check: held element released" src/selftest/ufo-restart.ts 'check\("held element released"'
expect "restart self-check: disabled case" src/selftest/ufo-restart.ts '"disabled",'
expect "bds-check requires ufo-restart-run1/2" scripts/bds-check.mjs 'ufo-restart-run\$\{i \+ 1\}'
expect "bds-check reads the release pack's enabled= across runs" scripts/bds-check.mjs 'ufo ufo: loaded, enabled='
expect "bds-check is its own npm script, outside npm test" package.json '"bds:check": '
if grep -qE '"test": "[^"]*bds' package.json; then no "npm test reaches BDS"; else ok "npm test does not run bds:check — package.json:$(grep -nE '"test":' package.json | cut -d: -f1)"; fi

echo "== 4. the GameTest runner can restart BDS (premise of L0-xcx17: 'a GameTest cannot restart the server')"
expect "the runner restarts BDS between paired tests" scripts/bds-gametest.mjs '^const RESTART_AFTER = new Map'
expect "the runner calls restart() after a paired test" scripts/bds-gametest.mjs 'if \(RESTART_AFTER\.has\(name\)\) restart\(deadline\);'
pairs=$(sed -n '/^const RESTART_AFTER = new Map/,/^\]);/p' scripts/bds-gametest.mjs | grep -E "^\s+\['andrew:")
echo "$pairs" | sed 's/^/     pair: /'
echo "     added in: $(git log --format='%h %ad %s' --date=short -S'RESTART_AFTER' -- scripts/bds-gametest.mjs | tail -1)"
ufo_tests=$(grep -cE "^\s+'andrew:ufo_" scripts/bds-gametest.mjs)
ufo_restart_tests=$(grep -E "^\s+'andrew:ufo_" scripts/bds-gametest.mjs | grep -c restart)
echo "     UFO tests in the GameTest runner: $ufo_tests, of them restart: $ufo_restart_tests"

echo "== 5. who ran the restart check after it was written"
echo "     UFO commits after 00d38cf (the last code the restart check ran on):"
git log --format='       %h %ad %s' --date=short 00d38cf..HEAD -- src/ufo src/selftest/ufo-restart.ts scripts/bds-check.mjs
verify=""
for d in .ai/verify ../../verify; do [ -d "$d" ] && verify="$d" && break; done
if [ -n "$verify" ]; then
  echo "     bds-check.mjs runs recorded in $verify (newest 3):"
  for f in "$verify"/*/*.json; do
    node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1]));if(/bds-check\.mjs|bds:check/.test(j.cmd||""))console.log(`       ${(j.ts||"").slice(0,16)} ${process.argv[1].split("/").slice(-2).join("/")} sha ${(j.code_sha||"").slice(0,7)} exit ${j.exit_code}`)' "$f" 2>/dev/null
  done | sort | tail -3
else
  echo "     no .ai/verify directory reachable — not measured"
fi

echo "== gate: UFO §14 DoD — the restart ACs run in the GameTest suite"
if echo "$pairs" | grep -q "ufo"; then ok "a UFO restart pair is in RESTART_AFTER"; else no "no UFO restart pair in RESTART_AFTER — the restart ACs are proven only by bds-check"; fi

echo "== $pass PASS, $fail FAIL"
[ "$fail" -eq 0 ]
