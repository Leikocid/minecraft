---
type: "concept-assumption"
node_id: "L0-sitm-asm3"
source_channel: "rollout"
analysis_version: 1
title: "Creative Equipment sub-group is \"swords,\" not \"hoes\" `CAN_ASSUME`"
aliases: ["L0-sitm-asm3"]
is_a: ["assumption"]
part_of: ["L0-sitm"]
relates_to: ["L0-sitm"]
priority: 520
size_chars: 545
tags: ["scythe-of-calamity", "assumption"]
level: 2
---
**Links:** `part_of: ["L0-sitm"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sitm-ent1"]`

# Creative Equipment sub-group is "swords," not "hoes" `CAN_ASSUME`

Creative Equipment sub-grouping is assumed to be "swords," matching the item's sword-slot enchantment and no-digger design (`L0-sitm-rul2`, `L0-sitm-rul3`), rather than "hoes," which would match its crafting ingredient (Diamond Hoe). The spec never states a Creative sub-group explicitly.

**Impact if wrong:** cosmetic-only change to `menu_category`'s group field in `L0-sitm-ent1`.
