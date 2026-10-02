---
type: "concept-acceptance-criterion"
node_id: "L0-pick-ac04"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 436
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-pick-r003"]
level: 2
---
GIVEN a Survival player holding `andrew:miners_pickaxe`, WHEN they break any of the 7 allow-listed blocks (`L0-pick-r003`), THEN the smelted product spawns with count 1 and the raw material never drops. Verified in-engine for `minecraft:iron_ore` → `minecraft:iron_ingot` by GameTest `pickaxe_autosmelt`; the other 6 pairs follow the same code path with no per-block special-casing. [channel: bds; src: `src/gametest/main.ts` L189-196]
