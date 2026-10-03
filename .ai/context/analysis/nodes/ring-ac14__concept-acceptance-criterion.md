---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac14"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-ac14"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 715
tags: ["is_a:acceptance-criterion", "verify:bds", "orbital-ac:14", "relates_to:L0-ring-r005", "relates_to:L0-ring-r006", "relates_to:L0-ring-ad01"]
level: 2
---
**AC-ring-14 · TNT resistance, no block drops, no fire** (Orbital AC-14; `r005`, `r006`) · **verify: bds**

GIVEN a pad of dirt, stone and planks, with Obsidian and Reinforced Deepslate pillars on ring d7 and a chest with 10 cobblestone on ring d14 (power ≥ 2). WHEN RMB is fired, THEN:
- the dirt, stone and planks around each charge are cratered;
- every Obsidian and Reinforced Deepslate block remains;
- the chest is destroyed;
- the `minecraft:item` count within footprint ± 8 is 0, with no cobblestone, dirt or planks;
- no `minecraft:fire` or `minecraft:soul_fire` block exists in the area;
- after the drain, `world.gameRules.doTileDrops` equals its pre-test value. Check this for both `true` and `false` initial values.
