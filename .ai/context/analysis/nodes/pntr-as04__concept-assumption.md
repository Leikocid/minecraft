---
type: "concept-assumption"
node_id: "L0-pntr-as04"
source_channel: "rollout"
analysis_version: 5
title: "AS-pntr-04 · Waterlogged cells become water"
aliases: ["L0-pntr-as04"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 817
tags: ["title:AS-pntr-04 · Waterlogged cells become water", "is_a:assumption", "CAN_ASSUME", "relates_to:L0-xasm6", "relates_to:L0-pntr-r002", "relates_to:L0-pntr-ent3"]
level: 2
---
# AS-pntr-04 · Waterlogged cells become water

**Gap.**
- §9 says liquids are not removed.
- `xasm6` says "waterlogged state is kept" but does not say what happens to the solid part.

**Assumption (CAN_ASSUME).**
- A waterlogged block (a waterlogged fence, stairs, seagrass or kelp base) is treated as a solid plus water.
- The solid is removed and the cell becomes `minecraft:water`, a source block.
- So an ocean-floor column through a waterlogged shipwreck keeps its water.

**Impact if wrong.**
- If the client reads "keep waterlogged" as "keep the whole block", those cells go into the keep class. That is a one-line change, but it leaves fences and stairs floating in the shaft.
- Setting a source block could also create a little extra water where the waterlogged block had been dry-adjacent. This is cosmetic.
