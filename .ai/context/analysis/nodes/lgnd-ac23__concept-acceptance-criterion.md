---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac23"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-ac23"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 1540
tags: ["v6", "katana", "channel:build", "channel:bds"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad14", "L0-lgnd-ac02", "L0-lgnd-ac15", "L0-lgnd-ac17", "L0-lgnd-ac21", "L0-katn"]
see_also: ["dragonkatanaspecv1ruen-part-3"]
---
**AC-lgnd-23: The Dragon Katana is def #4, with its own craft budget (Katana T01–T03, framework side).** Channel: `build` + `bds`.

**Build.**
- `tests/legendary-registry.test.mjs` asserts `keysFor(DRAGON_KATANA).crafted === "andrew:dk_crafted"` and the other `dk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `abilityKey`, `command`, **`craftTokenId` and `textPrefix`** over all four defs.
- `isLegendaryStack` is true for `andrew:dragon_katana` and `andrew:dragon_katana_crafted`, and false for `minecraft:diamond_sword`.

**BDS.** GIVEN the Web Sword, Scythe and Cannon flags are set and `andrew:dk_crafted` is unset
WHEN Survival player A crafts the Katana (the token reaches the inventory)
THEN exactly one broadcast names A and the localized "Dragon Katana",
AND A holds a marked `andrew:dragon_katana` with origin `craft`,
AND `dk_crafted` is set.

AND after a restart, player B's Survival craft is refunded with exactly 2 golden apples, 2 ender pearls and 1 diamond sword, with `andrew.katana.craft_blocked` and no broadcast.

AND `/give B andrew:dragon_katana` and a Creative copy leave the flag unchanged.
AND `/andrew:katana reset` clears only `dk_crafted`.
AND the other three flags never change.
AND the UFO `ufo:legendary_*` "never pulled" test passes with an added Katana stack, with no edit to `magn`.
