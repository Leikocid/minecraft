---
type: "concept-rule"
node_id: "L0-wind-r008"
source_channel: "rollout"
analysis_version: 2
title: "Rule: forced preparation touches natural blocks only, and aborts before touching a structure or spawner"
aliases: ["L0-wind-r008"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1366
tags: ["is_a:rule", "spawn-windmill", "site-prep", "safety", "relates_to:L0-wind-p003", "relates_to:L0-strf-r006", "relates_to:L0-wind-as10"]
level: 2
---
# Rule: forced preparation touches natural blocks only, and aborts before touching a structure or spawner

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p003, L0-strf-r006, L0-strf-r005, L0-wind-as10]`

**Source:** §4.7 item 10, §6 last bullet, §9 edge case 4, C-12.

- Only the spawn Windmill (stage 3) may prepare terrain. Normal Windmills and every other structure never do.
- **May replace / remove:** natural terrain and vegetation — dirt family, grass, sand, gravel, clay, stone family (stone, granite, diorite, andesite, deepslate, tuff, calcite), ores, snow/ice, logs, leaves, plants, flowers, mushrooms, vines, water, lava, and air.
- **Must never replace:** any block of a detected structure (collision signature), any `mob_spawner` / `trial_spawner`, and — as the safe reading of "natural" — any block not on the whitelist above (planks, cobblestone, glass, chests, beds, rails, crafted blocks…). Such a block anywhere in the plot + blend band + fill volume **rejects the whole position before any write**; the search takes the next candidate.
- The pre-check covers the exact volume the plan will write, including the blend band (`L0-wind-r009`) and the fill (`L0-wind-r010`), so edge smoothing cannot cut into a neighbouring structure.
- Liquids at the plot edge are sealed with natural blocks so no flow enters the plot.
