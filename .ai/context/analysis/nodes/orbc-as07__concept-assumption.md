---
type: "concept-assumption"
node_id: "L0-orbc-as07"
source_channel: "rollout"
analysis_version: 5
title: "ASM-orbc-07 · Creative Equipment category with no item group"
aliases: ["L0-orbc-as07"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 636
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-ent1", "item"]
level: 2
---
# ASM-orbc-07 · Creative Equipment category with no item group

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ent1", "L0-orbc-ac02"]`

**Gap.** §4 says "preferably in Equipment". The Web Sword and Scythe join vanilla groups (`itemGroup.name.sword`, `itemGroup.name.hoe`). There is no verified vanilla group for the fishing rod.

**Assumption.** `menu_category: {category: "equipment"}` with no `group`. The Cannon then appears as a standalone entry in the Equipment tab.

**Impact if wrong.** It is cosmetic. If a rod or tool group id is confirmed on the iPad, add `group`. The change is JSON only.
