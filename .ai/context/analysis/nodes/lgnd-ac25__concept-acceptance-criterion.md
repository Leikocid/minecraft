---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac25"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac25"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1326
tags: ["v7", "sculk-crossbow"]
level: 2
---
**AC-lgnd-25: The Sculk Crossbow is def #5 with its own craft budget (Crossbow T01–T03, framework side).** Channel: `build` + `bds`.

Related: L0-lgnd-ad16, L0-lgnd-as18, L0-lgnd-cx15, L0-lgnd-ac23, L0-sclk.

**Build.**
- `keysFor(SCULK_CROSSBOW).crafted === "andrew:sk_crafted"`, and the other `sk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `craftTokenId`, `textPrefix`, `command` over all five defs, and `abilityKey` over the four active ones. It fails if def #5 uses `sc`.
- `isLegendaryStack` is true for `andrew:sculk_crossbow` and its token; `isLegendaryWeaponStack` is true for the crossbow only; both are false for `minecraft:crossbow`.

**BDS.** GIVEN the other four flags are set and `andrew:sk_crafted` is unset
WHEN Survival player A crafts the crossbow (the token reaches the inventory)
THEN exactly one broadcast names A and the localized "Sculk Crossbow",
AND A holds a marked `andrew:sculk_crossbow` with origin `craft`, and `sk_crafted` is set,
AND no `andrew:sc_*` key changed.
AND after a restart, B's Survival craft is refunded with exactly 2 echo shards, 2 deepslate and 1 crossbow, with `andrew.crossbow.craft_blocked` and no broadcast (T02).
AND `/give B andrew:sculk_crossbow` and a Creative copy leave the flag unchanged (T03).
AND `/andrew:crossbow reset` clears only `sk_crafted`.
