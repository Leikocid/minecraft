#!/usr/bin/env bash
# Ticking areas leaked by the airship GameTests (diagnose, 2026-10-03).
#
# Runs the three airship scenarios that come before airship_linked_ring_invalid,
# keeps the server up, asks the console for `tickingarea list all-dimensions`
# and fails unless the world holds no ticking area afterwards. A leaked area
# eats one of the engine's ten slots for the rest of the suite.
#
# ANDREW_BDS_DIR picks a private instance (never bds, bds-qa or bds-ci).

set -u
cd "$(dirname "$0")/../.."
DIR="${ANDREW_BDS_DIR:?set ANDREW_BDS_DIR to a private instance}"
CONTAINER=$(sed -n 's/^ *container_name: *//p' "docker/$DIR/compose.yaml")
OUT=$(mktemp)

node scripts/bds-gametest.mjs --keep-up --timeout 1500 \
  --only andrew:airship_linked_ring \
  --only andrew:airship_linked_over_windmill \
  --only andrew:airship_linked_no_merge
suite=$?

pid=$(docker exec "$CONTAINER" sh -c 'for p in /proc/[0-9]*; do c=$(tr "\0" " " < $p/cmdline); case "$c" in *mc-server-runner*) continue;; *bedrock_server-*) basename $p; break;; esac; done')
docker exec "$CONTAINER" sh -c "printf 'tickingarea list all-dimensions\n' > /proc/$pid/fd/0"
sleep 3
docker logs --tail 40 "$CONTAINER" 2>&1 | tr -d '\r' > "$OUT"
(cd "docker/$DIR" && docker compose down >/dev/null 2>&1)

echo "--- tickingarea list after the three scenarios"
sed -n '/List of all ticking areas/,/ticking areas in use/p' "$OUT"
grep -o 'No ticking areas exist in any dimension.' "$OUT"
used=$(sed -n 's/^\([0-9]*\)\/10 ticking areas in use.*/\1/p' "$OUT" | tail -1)
# With none left the engine answers with a sentence, not a count.
if [ -z "$used" ] && grep -q 'No ticking areas exist in any dimension' "$OUT"; then used=0; fi
rm -f "$OUT"

if [ "$suite" -ne 0 ]; then echo "FAIL: the scenarios themselves failed (exit $suite)"; exit 1; fi
if [ -z "$used" ]; then echo "FAIL: no ticking-area list in the server log"; exit 1; fi
if [ "$used" -ne 0 ]; then echo "FAIL: $used ticking area(s) left behind by the scenarios"; exit 1; fi
echo "PASS: no ticking area left behind"
