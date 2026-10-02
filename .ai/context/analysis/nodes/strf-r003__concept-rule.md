---
type: "concept-rule"
node_id: "L0-strf-r003"
source_channel: "rollout"
analysis_version: 5
title: "Rule: dimension lock and build-height bounds"
aliases: ["L0-strf-r003"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1030
tags: ["is_a:rule", "dimension", "relates_to:L0-strf-r013"]
level: 2
---
# Rule: dimension lock and build-height bounds

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- Every `StructureDef.dimension` is exactly one of `minecraft:overworld` and `minecraft:nether`. The Windmill, Airship and Warden City use the Overworld, and the Bastion uses the Nether (§2, C-14). The End never matches. The discovery worker filters defs by the player's `dimension.id` before rolling.
- Vertical bounds come from `dimension.heightRange` at runtime and are never hard-coded. For reference: Overworld min −64, max 320 (exclusive), so the top buildable Y is 319. Nether min 0, max 128, with a bedrock roof at about 123–127.
- A candidate whose rotated AABB leaves `[heightRange.min + 1, heightRange.max − 1]` is invalid. The +1 keeps the bottom bedrock layer untouched. This covers the Airship world-ceiling rejection (§5.4, test 31) and the Warden City depth floor.
- The Nether additionally forbids any AABB cell at Y ≥ 122, so the bedrock roof is never replaced. Bastion height of 10–12 plus a floor ≥ 32 fits.
