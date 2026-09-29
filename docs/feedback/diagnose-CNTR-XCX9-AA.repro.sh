#!/usr/bin/env bash
# CX-L0-09 check on BDS, driving src/gametest/probe-give.ts.
#
# Passes only when a legendary that did not come out of a crafting grid leaves
# the craft flag alone (Web Sword §3, Scythe §1, Orbital §4 / AC-2):
#   give_websword / give_scythe  vanilla /give to a Survival player: flag stays
#                                unset, the copy stays, unmarked, nothing refunded
#   give_then_craft              after that /give, the first real craft claims
#   give_after_craft             /give after the real craft: the copy is kept
#   creative_copy_pickup         an unmarked copy picked up: flag stays unset
#
# ANDREW_BDS_DIR picks the BDS instance (default bds-ci). Agents running at once
# share the andrew-bds-ci container and kill each other's runs; give each one a
# copy of docker/bds-ci with its own container name and ports.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log

args=()
for t in give_websword give_scythe give_then_craft give_after_craft creative_copy_pickup; do
  args+=(--only "andrew:probe_xcx9_$t")
done
node scripts/bds-gametest.mjs "${args[@]}" "$@" || exit 1

grep -E "XCX9 |craft gate|first craft by|craft blocked for" "$log"

fail=0
expect() {
  if grep -qE "$2" "$log"; then echo "PASS $1"; else echo "FAIL $1 — expected /$2/"; fail=1; fi
}
expect give_websword        "XCX9 give_websword RESULT mode=Survival give_success=1 flag=false held=1 marks=none refund=0$"
expect give_scythe          "XCX9 give_scythe RESULT mode=Survival give_success=1 flag=false held=1 marks=none refund=0$"
expect give_then_craft      "XCX9 give_then_craft RESULT give_success=1 tester\[flag=false held=1 marks=none refund=0\] crafter\[flag=true held=1 marks=craft refund=0\]$"
expect give_after_craft     "XCX9 give_after_craft RESULT give_success=1 flag=true held=1 marks=none refund=0$"
expect creative_copy_pickup "XCX9 creative_copy_pickup RESULT flag=false held=1 marks=none refund=0$"
exit $fail
