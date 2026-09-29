#!/usr/bin/env bash
# CX-lgnd-10 checks on BDS, driving src/gametest/probe-retention.ts.
#
#   two-copies  every marked Web Sword a player dies with still exists after
#               respawn (held, on the ground, pending or owed). Red while
#               retention path B deletes the copy it cannot fit into pending.
#   offhand     a marked sword in the off hand comes back through retention
#               (path B), with nothing owed. The run patches
#               minecraft:allow_off_hand into web_sword.json — without it the
#               engine refuses setEquipment(Offhand) — and restores the file.
#
# ANDREW_BDS_DIR picks the BDS instance (default bds-ci). Agents running at
# once all share the andrew-bds-ci container and kill each other's runs; give
# each one a copy of docker/bds-ci with its own container name and ports.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log

case "${1:-}" in
  two-copies)
    node scripts/bds-gametest.mjs --only andrew:probe_retention_two_copies || exit 1
    grep -E "RETENTION-2|legendary retention: (path|returned)" "$log"
    grep -q "RETENTION-2 RESULT accounted=2/2" "$log"
    ;;
  offhand)
    item=packs/behavior/items/web_sword.json
    cp "$item" "$item.bak"
    trap 'mv "$item.bak" "$item"' EXIT
    node -e '
      const fs = require("fs");
      const f = process.argv[1];
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      j["minecraft:item"].components["minecraft:allow_off_hand"] = true;
      fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
    ' "$item"
    node scripts/bds-gametest.mjs --only andrew:probe_retention_offhand || exit 1
    grep -E "RETENTION-OFF|legendary retention: (path|returned)|legendary recovery: .*(vanished|fell|returning|owed)" "$log"
    grep -q "legendary retention: path B — reclaimed 1 " "$log" &&
      grep -q "RETENTION-OFF RESULT .*ACCOUNTED; owed=none" "$log"
    ;;
  *)
    echo "usage: $0 two-copies|offhand" >&2
    exit 2
    ;;
esac
