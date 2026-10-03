#!/usr/bin/env bash
# CX-lgnd-14 checks on BDS, driving src/gametest/probe-stand-void.ts. Each mode
# runs the probe once and turns one RESULT line into an exit code: 0 when the
# owner holds the stand's legendary again at gen 1 and the ledger is at 1.
#
#   left          the stand falls through a shaft into the Void and is left
#                 alone. Red while recovery has no path for an armour stand.
#   kill          the stand is killed below the floor (on the first tick there,
#                 and 10 ticks later); its spill carries the mark. Red while
#                 recovery files an item that vanished below the floor as
#                 "unloaded with its chunk" (recovery.ts:326).
#   kill-patched  as kill, with recovery.ts:326 patched for the run to skip the
#                 chunk branch below the floor; the file is restored on exit.
#
# Exit 3: the runner itself failed, so the answer is not a measurement.
# ANDREW_BDS_DIR picks the BDS instance (default bds-ci). Agents running at
# once share the andrew-bds-ci container; give each a private copy.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log

run_probe() {
  node scripts/bds-gametest.mjs --only andrew:probe_stand_void || exit 3
  grep -a "STAND-VOID" "$log" | sed 's/.*\[gametest\] //'
}

returned() {
  grep -aqE "STAND-VOID $1 RESULT [^ ]+ id [^:]+: owner holds gens \[1\], ledger 1;" "$log"
}

case "${1:-}" in
  left)
    run_probe
    returned left
    ;;
  kill)
    run_probe
    returned first && returned late
    ;;
  kill-patched)
    src=src/legendary/recovery.ts
    cp "$src" "$src.bak"
    trap 'mv "$src.bak" "$src"' EXIT
    node -e '
      const fs = require("fs");
      const f = process.argv[1];
      const from = "if (!w.dimension.isChunkLoaded(w.location)) {";
      const to = "if (w.location.y >= w.dimension.heightRange.min && !w.dimension.isChunkLoaded(w.location)) {";
      const s = fs.readFileSync(f, "utf8");
      if (s.split(from).length !== 2) { console.error("patch target not found exactly once"); process.exit(4); }
      fs.writeFileSync(f, s.replace(from, to));
    ' "$src" || exit 3
    run_probe
    returned first && returned late
    ;;
  *)
    echo "usage: $0 left|kill|kill-patched" >&2
    exit 2
    ;;
esac
