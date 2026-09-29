---
type: "concept-assumption"
node_id: "L0-orbc-as01"
source_channel: "rollout"
analysis_version: 3
title: "ASM-orbc-01 · \"N blocks above the chosen point\" is measured from the target block's Y"
aliases: ["L0-orbc-as01"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 687
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-r007"]
level: 2
---
# ASM-orbc-01 · "N blocks above the chosen point" is measured from the target block's Y

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r007"]`

**Gap.** §8 says "30 blocks above the selected point", but does not say whether that is the block's Y, its top face (Y+1) or the hit point.

**Assumption.**
- `spawnY = target.y + offset`, in integer block coordinates.
- The charge's feet are at `spawnY`, and x and z are at the column centre (+0.5).
- The hit face and the sub-block hit point are ignored.

**Impact if wrong.** ±1 block of height, which is about 1 tick of fall. It only affects AC-4's exact numbers, and the unit test holds the constant.
