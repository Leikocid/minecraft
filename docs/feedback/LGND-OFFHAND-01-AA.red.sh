#!/usr/bin/env bash
# LGND-OFFHAND-01-AA: the same checks with one half of the fix taken out, so
# each can be shown red before it is shown green (ai-kit run-check --expect-red).
# Every file touched is restored on exit.
#
#   items   minecraft:allow_off_hand stripped from both items -> the item unit tests
#   code    src/legendary off-hand reads reverted to BASE     -> retention and craft-gate unit tests
#   engine  minecraft:allow_off_hand stripped from both items -> GameTest legendary_offhand_admitted
#
# BASE (default 9fc3d34, the commit before the fix) is where `code` takes the
# old modules from. ANDREW_BDS_DIR picks the BDS instance for `engine`.

set -u
cd "$(dirname "$0")/../.."
BASE="${BASE:-9fc3d34}"
ITEMS=(packs/behavior/items/web_sword.json packs/behavior/items/scythe_of_calamity.json)
MODULES=(src/legendary/state.ts src/legendary/retention.ts src/legendary/craftgate.ts src/legendary/recovery.ts)

restore() { git checkout HEAD -- "$@"; }

strip_component() {
  trap 'restore "${ITEMS[@]}"' EXIT
  for f in "${ITEMS[@]}"; do
    node -e '
      const fs = require("fs");
      const f = process.argv[1];
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      delete j["minecraft:item"].components["minecraft:allow_off_hand"];
      fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
    ' "$f"
  done
  if grep -q allow_off_hand "${ITEMS[@]}"; then
    echo "the component is still there — this run would prove nothing" >&2
    exit 3
  fi
}

case "${1:-}" in
  items)
    strip_component
    node --test tests/web-sword-item.test.mjs tests/scythe-item.test.mjs
    ;;
  code)
    trap 'restore "${MODULES[@]}"' EXIT
    for f in "${MODULES[@]}"; do git show "$BASE:$f" > "$f"; done
    node --test tests/legendary-recovery.test.mjs tests/legendary-craftgate.test.mjs
    ;;
  engine)
    strip_component
    node scripts/bds-gametest.mjs --only andrew:legendary_offhand_admitted
    ;;
  *)
    echo "usage: $0 items|code|engine" >&2
    exit 2
    ;;
esac
