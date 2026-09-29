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
# Host ports: P (tcp+udp), P+1 (v6), P+2..P+9 (gameplay udp), DISC (LAN discovery udp).
P="${WCX_PORT:-19380}"
DISC="${WCX_DISC:-7577}"
cd "$ROOT"

mkdir -p "$DIR"
sed -e "s/container_name: andrew-bds-ci/container_name: $NAME/" \
    -e "s/\"19136:19136\/tcp\"/\"$P:$P\/tcp\"/" -e "s/\"19136:19136\/udp\"/\"$P:$P\/udp\"/" \
    -e "s/19160-19169:19160-19169/$((P + 2))-$((P + 9)):$((P + 2))-$((P + 9))/" -e "s/\"7553:7553\/udp\"/\"$DISC:$DISC\/udp\"/" \
    -e "s/SERVER_PORT: \"19136\"/SERVER_PORT: \"$P\"/" -e "s/SERVER_PORT_V6: \"19137\"/SERVER_PORT_V6: \"$((P + 1))\"/" \
    docker/bds-ci/compose.yaml > "$DIR/compose.yaml"
sed -e "s/^server-port=.*/server-port=$P/" -e "s/^server-portv6=.*/server-portv6=$((P + 1))/" \
    -e "s/^server-udp-ports=.*/server-udp-ports=$((P + 2))-$((P + 9))/" docker/bds-ci/server.properties > "$DIR/server.properties"
grep -q "container_name: $NAME" "$DIR/compose.yaml" && ! grep -vE '^\s*#' "$DIR/compose.yaml" | grep -qE '1913[2-7]|1916[0-9]|7553' \
  || { echo "FAIL: private compose still points at a shared port or name"; exit 2; }
if [ ! -d "$DIR/data" ] && [ -n "${WCX_SEED_DATA:-}" ]; then
  mkdir -p "$DIR/data"
  (cd "$WCX_SEED_DATA" && tar --exclude ./worlds --exclude './ContentLog*' -cf - .) | (cd "$DIR/data" && tar -xf -)
fi

cleanup() {
  docker compose -f "$DIR/compose.yaml" down >/dev/null 2>&1 || true
  [ "${WCX_KEEP:-0}" = 1 ] || rm -rf "$DIR"
  rm -f "${LOGF:-}"
}
trap cleanup EXIT

ANDREW_BDS_DIR="$ID" node scripts/bds-up.mjs --fresh-world --timeout 600

# Read into a file first: under pipefail, `docker logs | grep -q` fails on the SIGPIPE a match causes.
LOGF="$(mktemp)"
logs() { docker logs "$NAME" > "$LOGF" 2>&1; cat "$LOGF"; }
has() { docker logs "$NAME" > "$LOGF" 2>&1; grep -qE "$1" "$LOGF"; }
wait_for() { # pattern, seconds
  local t=0
  until has "$1"; do
    t=$((t + 5)); [ "$t" -le "$2" ] || { echo "FAIL: no line /$1/ within $2 s"; logs | grep -E 'andrew\]' | tail -40; return 1; }
    sleep 5
  done
}

# The image's send-command finds no server under Rosetta; same stdin write as scripts/bds-gametest.mjs sendCommand.
PID="$(docker exec "$NAME" sh -c 'for p in /proc/[0-9]*; do c=$(tr "\0" " " < $p/cmdline); case "$c" in *mc-server-runner*) continue;; *bedrock_server-*) basename $p; break;; esac; done')"
[[ "$PID" =~ ^[0-9]+$ ]] || { echo "FAIL: no bedrock_server process in $NAME (got '$PID')"; exit 1; }
docker exec "$NAME" sh -c "echo 'andrew:structure enable windmill' > /proc/$PID/fd/0"
wait_for 'spawn windmill: search finished' 900
echo "--- live log (spawn search) ---"
logs | grep -E 'Difficulty:|Pack Stack - \[00\]|spawn windmill:|windmill:spawn placement threw' | sed -n '1,40p'

has 'Difficulty: 0 PEACEFUL' || { echo "FAIL: the world is not Peaceful"; exit 1; }
has 'spawn windmill: search finished: done' || { echo "FAIL: the search did not end done"; exit 1; }
has 'strf runtime: windmill:spawn placement threw .*the world is Peaceful' \
  || { echo "FAIL: placeAt never caught the guard throw (the changed path was not entered)"; exit 1; }

docker restart "$NAME" >/dev/null
wait_for 'search already ran once in this world \(status=' 300
echo "--- after restart ---"
LAST="$(logs | grep -E 'search already ran once in this world' | tail -1)"
echo "$LAST"
[[ "$LAST" == *"status=done"* ]] \
  || { echo "FAIL: the persisted record is not done"; exit 1; }
echo "PASS: Peaceful world, spawn search done, guard step deferred by placeAt, record persisted as done"
