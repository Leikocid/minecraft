---
type: "concept-assumption"
node_id: "L0-orbc-as08"
source_channel: "rollout"
analysis_version: 5
title: "ASM-orbc-08 · Omitting `minecraft:damage` gives exactly empty-hand damage"
aliases: ["L0-orbc-as08"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 679
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-ent1", "item"]
level: 2
---
# ASM-orbc-08 · Omitting `minecraft:damage` gives exactly empty-hand damage

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ent1", "L0-orbc-ac01"]`

**Gap.** §2 requires melee damage equal to an empty-hand punch. The default attack damage of a custom item without the component is believed to be 1, the same as the hand, but it is not measured.

**Assumption.**
- The item JSON has no `minecraft:damage` and no `minecraft:tags`, so no weapon or enchant-slot bonuses apply.
- `ac01` measures the result against an empty hand on BDS.

**Impact if wrong.** Set `minecraft:damage` to the value that matches the measurement. It is a JSON-only fix.
