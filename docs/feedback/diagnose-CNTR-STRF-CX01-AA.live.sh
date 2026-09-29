#!/usr/bin/env bash
# CNTR-STRF-CX01-AA live check: release pack and gametest pack in one BDS world.
# The gametest pack's strf plans a record; the release pack's durable registry
# must stay empty, also after a restart of the same world.
#
# Runs on a private instance (docker/bds-cx01, ports 19270-19279, 7562): the
# shared bds-ci collides with parallel wave agents. The instance is removed on exit.
# Usage: bash docs/feedback/diagnose-CNTR-STRF-CX01-AA.live.sh   (after npm run build)
set -euo pipefail
cd "$(dirname "$0")/../.."

DIR=docker/bds-cx01
NAME=andrew-bds-cx01
TEST=andrew:strf_discovery_tick_budget

mkdir -p "$DIR"
sed -e "s/container_name: andrew-bds-ci/container_name: $NAME/" \
    -e 's/"19136:19136\/tcp"/"19270:19270\/tcp"/' -e 's/"19136:19136\/udp"/"19270:19270\/udp"/' \
    -e 's/"19160-19169:19160-19169\/udp"/"19272-19279:19272-19279\/udp"/' -e 's/"7553:7553\/udp"/"7562:7562\/udp"/' \
    -e 's/SERVER_PORT: "19136"/SERVER_PORT: "19270"/' -e 's/SERVER_PORT_V6: "19137"/SERVER_PORT_V6: "19271"/' \
    docker/bds-ci/compose.yaml > "$DIR/compose.yaml"
sed -e 's/^server-port=19136/server-port=19270/' -e 's/^server-portv6=19137/server-portv6=19271/' \
    -e 's/^server-udp-ports=19160-19169/server-udp-ports=19272-19279/' \
    docker/bds-ci/server.properties > "$DIR/server.properties"
cleanup() {
  docker compose -f "$DIR/compose.yaml" down >/dev/null 2>&1 || true
  rm -rf "$DIR"
}
trap cleanup EXIT

ANDREW_BDS_DIR=bds-cx01 node scripts/bds-gametest.mjs --no-build --keep-up --only "$TEST"

docker restart "$NAME" >/dev/null
for _ in $(seq 1 200); do
  [ "$(docker logs "$NAME" 2>&1 | grep -c '\[andrew\] spawn windmill: not started')" -ge 2 ] && break
  sleep 3
done

LOG=$(docker logs "$NAME" 2>&1)
echo "--- evidence"
echo "$LOG" | grep -e 'Server started' -e '\[andrew\] strf registry' -e '\[andrew\] structures enabled' \
  -e 'strf-test-hook armed' -e 'strf discovery budget: chunks' -e "onTestPassed: $TEST" -e 'Stopping server'

boots=$(echo "$LOG" | grep -c '\[andrew\] strf registry: shards=0 records=0 evaluated=0')
planned=$(echo "$LOG" | grep -c 'strf discovery budget: chunks=.* records=[a-z_]*:o:')
echo "--- release boots with an empty registry: $boots (expected 2); gametest discovery runs that planned a record: $planned (expected 1)"
[ "$boots" -eq 2 ] && [ "$planned" -eq 1 ]
