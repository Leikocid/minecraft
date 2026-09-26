---
type: "concept-acceptance-criterion"
node_id: "L0-pick-ac05"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-pick-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 248
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-pick-r004"]
level: 2
---
GIVEN the same pickaxe, WHEN the player breaks `minecraft:stone` (not on the allow-list), THEN it drops vanilla `minecraft:cobblestone`, not an auto-smelt product. [channel: bds; src: `src/gametest/main.ts` `pickaxe_keeps_vanilla_drops`, L198-207]
