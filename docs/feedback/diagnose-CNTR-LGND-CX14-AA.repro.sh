#!/usr/bin/env bash
# CX-lgnd-14 checks on BDS, driving src/gametest/probe-stand-void.ts. Each mode
# runs the probes it needs once and turns RESULT lines into an exit code: 0 when
# the owner holds the legendary again at gen 1 and the ledger is at 1.
#
#   left     an armour stand holding a marked legendary falls through a shaft
#            into the Void and is left alone. Red while recovery has no path
#            for an armour stand.
#   kill     the stand is killed below the floor (on its first tick there, and
#            10 ticks later); the spill carries the mark. Red while recovery
#            files an item that vanished below the floor as "unloaded with its
#            chunk" (recovery.ts:326).
#   band     a marked item last seen within one block above the floor, then
#            gone. Red while holderCells hands getBlock a cell below the floor
#            (recovery.ts:433) and check() dies on the throw.
#   patched  kill and band with two lines of recovery.ts patched for the run —
#            the chunk branch only above the floor, holderCells only inside the
#            world. The file is restored on exit.
#
# Exit 3: the runner itself failed, so the answer is not a measurement.
# ANDREW_BDS_DIR picks the BDS instance (default bds-ci). Agents running at
# once share the andrew-bds-ci container; give each a private copy.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log

run_probe() {
  local only=()
  for t in "$@"; do only+=(--only "andrew:$t"); done
  node scripts/bds-gametest.mjs "${only[@]}" || exit 3
  grep -a "STAND-VOID" "$log" | sed 's/.*\[gametest\] //' | grep -v "handed over"
  grep -a "LocationOutOfWorldBoundariesError" "$log" | sed 's/.*\[Scripting\] //'
  return 0
}

returned() {
  grep -aqE "STAND-VOID $1 RESULT [^ ]+ id [^:]+: owner holds gens \[1\], ledger 1;" "$log"
}

case "${1:-}" in
  left)
    run_probe probe_stand_void
    returned left
    ;;
  kill)
    run_probe probe_stand_void
    returned first && returned late
    ;;
  band)
    run_probe probe_item_floor_band
    returned band
    ;;
  patched)
    src=src/legendary/recovery.ts
    cp "$src" "$src.bak"
    trap 'mv "$src.bak" "$src"' EXIT
    node -e '
      const fs = require("fs");
      const f = process.argv[1];
      const edits = [
        ["if (!w.dimension.isChunkLoaded(w.location)) {",
         "if (w.location.y >= w.dimension.heightRange.min && !w.dimension.isChunkLoaded(w.location)) {"],
        ["return [0, -1].map((dy) => ({ x: w.location.x, y: w.location.y + dy, z: w.location.z }));",
         "return [0, -1].map((dy) => ({ x: w.location.x, y: w.location.y + dy, z: w.location.z })).filter((c) => c.y >= w.dimension.heightRange.min);"],
      ];
      let s = fs.readFileSync(f, "utf8");
      for (const [from, to] of edits) {
        if (s.split(from).length !== 2) { console.error(`patch target not found exactly once: ${from}`); process.exit(4); }
        s = s.replace(from, to);
      }
      fs.writeFileSync(f, s);
    ' "$src" || exit 3
    run_probe probe_stand_void probe_item_floor_band
    returned first && returned late && returned band
    ;;
  *)
    echo "usage: $0 left|kill|band|patched" >&2
    exit 2
    ;;
esac
