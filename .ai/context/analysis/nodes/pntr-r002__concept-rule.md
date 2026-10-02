---
type: "concept-rule"
node_id: "L0-pntr-r002"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-r002"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1145
tags: ["title:Keep liquids and Survival-unbreakable blocks, never stop below them", "is_a:rule", "relates_to:L0-xasm6", "relates_to:L0-pntr-ent3", "relates_to:L0-pntr-as04", "source:orbital-§9", "ac:7"]
level: 2
---
**Rule R-pntr-2 · Keep set, and no early stop.**

A column cell is **kept** (left untouched) when it is:
- air of any kind;
- a liquid: `water`, `flowing_water`, `lava`, `flowing_lava`;
- on the `L0-xasm6` deny list of Survival-unbreakable blocks: `bedrock`, `end_portal_frame`, `end_portal`, `end_gateway`, `barrier`, `light_block`, the command blocks, `structure_block`, `structure_void`, `jigsaw`, `allow`, `deny`, `border_block`, `invisible_bedrock`, `moving_block`, and the piston arm collisions.

A kept cell **never** ends the column. Processing continues with the next layer down (Orbital §9: "must not stop the calculation below them"). For example, a 5×5 column through an ocean floor removes the stone under the water and keeps the water, and the water then falls. A column through bedrock at the Overworld bottom keeps the bedrock and removes nothing else, because nothing is below it.

Waterlogged solids are neither purely kept nor purely removed: the solid part goes and the water stays (`L0-pntr-as04`).

**Source of truth.** The list is one exported constant in `src/orbital/` with a unit test (`xasm6`). `ring` does not use it.
