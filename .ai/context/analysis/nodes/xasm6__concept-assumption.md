---
type: "concept-assumption"
node_id: "L0-xasm6"
source_channel: "rollout"
analysis_version: 3
title: "ASM-L0-6 · \"Survival-unbreakable\" is a fixed deny list"
aliases: ["L0-xasm6"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0", "L0-pntr"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
priority: 540
size_chars: 983
tags: ["title:ASM-L0-6 · \"Survival-unbreakable\" is a fixed deny list", "alias:L0-xasm6", "is_a:assumption", "relates_to:L0", "relates_to:L0-pntr", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "CAN_ASSUME"]
level: 1
---
# ASM-L0-6 · "Survival-unbreakable" is a fixed deny list

**Gap.** Orbital §9 keeps "blocks a Survival player cannot break (Bedrock, End Portal Frame, active End Portal and similar engine-protected blocks)". Stable 2.10.0 exposes no block-hardness query.

**Assumption (CAN_ASSUME).** The deny list lives in `src/orbital/` and has a test:
- `bedrock`, `end_portal_frame`, `end_portal`, `end_gateway`, `barrier`, `light_block`;
- `command_block` ×3, `structure_block`, `structure_void`, `jigsaw`;
- `allow`, `deny`, `border_block`;
- `invisible_bedrock`, `moving_block`, `piston_arm_collision` / `sticky_piston_arm_collision`.

Also kept: `air` and all liquids plus waterlogged state (§9). Everything else is removed, **including** Obsidian, Crying Obsidian, Reinforced Deepslate, Respawn Anchor and Ancient Debris.

**Impact if wrong.** A block in the Warden City monument (Reinforced Deepslate) or a modded block is kept or removed against expectation. Changing the list is cheap.
