#!/usr/bin/env bash
# CNTR-WIND-CX01-AA, live: the spawn Windmill search of the current build on a
# fresh Peaceful world, the condition that left the production record
# `failed ... waits: the world is Peaceful`.
#
# Runs on a private BDS instance docker/$WCX_ID (own container, ports, data), so
# production (19132), QA (19134) and the shared bds-ci (19136) stay untouched.
# WCX_SEED_DATA may name an existing BDS data dir to copy the server binary from
# instead of downloading it. The instance is removed at the end (WCX_KEEP=1 keeps it).
#
# PASS: the world is PEACEFUL, the search ends `done`, the guard throw is caught
# by placeAt (the changed path), and after a restart the record reads status=done.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ID="${WCX_ID:-bds-wcx1}"
DIR="$ROOT/docker/$ID"
NAME="andrew-$ID"
cd "$ROOT"

mkdir -p "$DIR"
sed -e "s/container_name: andrew-bds-ci/container_name: $NAME/" \
    -e 's/"19136:19136\/tcp"/"19280:19280\/tcp"/' -e 's/"19136:19136\/udp"/"19280:19280\/udp"/' \
    -e 's/19160-19169:19160-19169/19282-19289:19282-19289/' -e 's/"7553:7553\/udp"/"7564:7564\/udp"/' \
    -e 's/SERVER_PORT: "19136"/SERVER_PORT: "19280"/' -e 's/SERVER_PORT_V6: "19137"/SERVER_PORT_V6: "19281"/' \
    docker/bds-ci/compose.yaml > "$DIR/compose.yaml"
sed -e 's/^server-port=.*/server-port=19280/' -e 's/^server-portv6=.*/server-portv6=19281/' \
    -e 's/^server-udp-ports=.*/server-udp-ports=19282-19289/' docker/bds-ci/server.properties > "$DIR/server.properties"
grep -q "container_name: $NAME" "$DIR/compose.yaml" && ! grep -vE '^\s*#' "$DIR/compose.yaml" | grep -qE '1913[2-7]|1916[0-9]|7553' \
  || { echo "FAIL: private compose still points at a shared port or name"; exit 2; }
if [ ! -d "$DIR/data" ] && [ -n "${WCX_SEED_DATA:-}" ]; then
  mkdir -p "$DIR/data"
  (cd "$WCX_SEED_DATA" && tar --exclude ./worlds --exclude './ContentLog*' -cf - .) | (cd "$DIR/data" && tar -xf -)
fi

cleanup() {
  docker compose -f "$DIR/compose.yaml" down >/dev/null 2>&1 || true
  [ "${WCX_KEEP:-0}" = 1 ] || rm -rf "$DIR"
}
trap cleanup EXIT

ANDREW_BDS_DIR="$ID" node scripts/bds-up.mjs --fresh-world --timeout 600

logs() { docker logs "$NAME" 2>&1; }
wait_for() { # pattern, seconds
  local t=0
  until logs | grep -qE "$1"; do
    t=$((t + 5)); [ "$t" -le "$2" ] || { echo "FAIL: no line /$1/ within $2 s"; logs | grep -E 'andrew\]' | tail -40; return 1; }
    sleep 5
  done
}

docker exec "$NAME" send-command "andrew:structure enable windmill"
wait_for 'spawn windmill: search finished' 900
echo "--- live log (spawn search) ---"
logs | grep -E 'Difficulty:|Pack Stack - \[00\]|spawn windmill:|windmill:spawn placement threw' | sed -n '1,40p'

logs | grep -q 'Difficulty: 0 PEACEFUL' || { echo "FAIL: the world is not Peaceful"; exit 1; }
logs | grep -q 'spawn windmill: search finished: done' || { echo "FAIL: the search did not end done"; exit 1; }
logs | grep -qE 'strf runtime: windmill:spawn placement threw .*the world is Peaceful' \
  || { echo "FAIL: placeAt never caught the guard throw (the changed path was not entered)"; exit 1; }

docker restart "$NAME" >/dev/null
wait_for 'search already ran once in this world \(status=' 300
echo "--- after restart ---"
logs | grep -E 'search already ran once in this world' | tail -1
logs | grep 'search already ran once in this world' | tail -1 | grep -q 'status=done' \
  || { echo "FAIL: the persisted record is not done"; exit 1; }
echo "PASS: Peaceful world, spawn search done, guard step deferred by placeAt, record persisted as done"
