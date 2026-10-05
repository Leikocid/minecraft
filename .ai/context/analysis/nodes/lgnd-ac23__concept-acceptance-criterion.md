---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac23"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac23"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1382
tags: ["v6", "katana", "shipped-1.5.0"]
level: 2
---
**AC-lgnd-23: The Dragon Katana is def #4, with its own craft budget (Katana T01–T03, framework side).** Channel: `build` + `bds`. Shipped in 1.5.0 (`KATA-LGND-01-AA`).

Related: L0-lgnd-ad14, L0-lgnd-ac02, L0-lgnd-ac15, L0-lgnd-ac17, L0-lgnd-ac21, L0-katn.

**Build.**
- `tests/legendary-registry.test.mjs` asserts `keysFor(DRAGON_KATANA).crafted === "andrew:dk_crafted"` and the other `dk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `abilityKey`, `command`, `craftTokenId` and `textPrefix` over all defs.
- `isLegendaryStack` is true for `andrew:dragon_katana` and `andrew:dragon_katana_crafted`, and false for `minecraft:diamond_sword`.

**BDS.** GIVEN the Web Sword, Scythe and Cannon flags are set and `andrew:dk_crafted` is unset
WHEN Survival player A crafts the Katana
THEN exactly one broadcast names A and the localized "Dragon Katana", A holds a marked `andrew:dragon_katana` with origin `craft`, and `dk_crafted` is set.
AND after a restart, B's Survival craft is refunded with exactly 2 golden apples, 2 ender pearls and 1 diamond sword, with `andrew.katana.craft_blocked` and no broadcast.
AND `/give` and Creative copies leave the flag unchanged; `/andrew:katana reset` clears only `dk_crafted`; the other flags never change.
AND (v7, replaces the "never pulled" clause) the Katana is magnetic like the other weapons with no edit to `magn` (`ac21`).
