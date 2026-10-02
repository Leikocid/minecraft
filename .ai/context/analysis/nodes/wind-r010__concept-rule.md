---
type: "concept-rule"
node_id: "L0-wind-r010"
source_channel: "rollout"
analysis_version: 5
title: "Rule: fill only shallow voids directly under the plot; never fill a deep cave or ravine"
aliases: ["L0-wind-r010"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 905
tags: ["is_a:rule", "spawn-windmill", "site-prep", "void-fill", "relates_to:L0-wind-p003", "relates_to:L0-wind-as04"]
level: 2
---
# Rule: fill only shallow voids directly under the plot; never fill a deep cave or ravine

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p003, L0-wind-e004, L0-wind-as04]`

**Source:** §4.7 item 12, §9 edge case 3, §12 bullet 2.

- Fill is allowed only for air/liquid cells that are within `D` blocks below the target surface (`L0-wind-as04`) **and** under a cell where a template block or field block would otherwise have no support.
- A cave or ravine whose open volume extends deeper than `D` is left open below depth `D`: the fill makes a `D`-thick natural cap over it, not a plug down to the floor.
- Fill material: dirt under grass/farmland, stone below 3 blocks.
- The template's own foundation layer counts as support; the fill only closes gaps under it.
- A test world with a cave under the chosen site must still contain open cave volume below the cap after prep.
