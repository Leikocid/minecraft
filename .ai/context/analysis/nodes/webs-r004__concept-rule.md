---
type: "concept-rule"
node_id: "L0-webs-r004"
source_channel: "rollout"
analysis_version: 1
level: 2
aliases: ["L0-webs-r004"]
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1348
tags: ["rule", "protected-blocks", "unloaded-chunks"]
---
---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-p001", "L0-webs-gl03"]
---
**Rule (R-webs-004 — Protected-block filter, Q-013).** Within the 27-cell cube, a cell is skipped (left untouched) instead of replaced when it is:
- occupied by a living entity (the entity is never moved, damaged, or removed; Cobweb is placed around it, not through it);
- a block with `minecraft:inventory`, or one of the named block-entities: chest, trapped/ender chest, barrel, shulker box, hopper, dropper, dispenser, furnace variants, brewing stand, beacon, lectern, jukebox, sign, banner, spawner, campfire, enchanting table, anvil, bed;
- one of the indestructible/special blocks: bedrock, barrier, command block, structure block, jigsaw, end portal + frame, nether portal, light block, reinforced deepslate;
- **outside the loaded/accessible area** — the ability never forces a chunk to load or writes into a cell it cannot confirm is loaded; such cells are treated exactly like a protected block, not retried or queued.

Liquids (water/lava) are replaced like ordinary blocks. Any block type the filter doesn't recognize defaults to **skip** (fail closed, never fail open) — this covers future/modded/unexpected block types the closed list doesn't name.

**Rationale.** Spec §6/§12; closed list and "when in doubt, skip" posture from decision Q-013.
