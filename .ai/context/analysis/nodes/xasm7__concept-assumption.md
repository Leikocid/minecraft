---
type: "concept-assumption"
node_id: "L0-xasm7"
source_channel: "rollout"
analysis_version: 3
title: "ASM-L0-7 · \"No drops\" includes ordinary container contents"
aliases: ["L0-xasm7"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0", "L0-pntr", "L0-ring", "L0-adr-ochg"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
priority: 540
size_chars: 789
tags: ["title:ASM-L0-7 · \"No drops\" includes ordinary container contents", "alias:L0-xasm7", "is_a:assumption", "relates_to:L0", "relates_to:L0-pntr", "relates_to:L0-ring", "relates_to:L0-adr-ochg", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "CAN_ASSUME"]
level: 1
---
# ASM-L0-7 · "No drops" includes ordinary container contents

**Gap.**
- For LMB, Orbital §9 says container contents disappear.
- For RMB, §10 says blocks broken by the blast vanish "without item drops". It does not mention container contents.

**Assumption (CAN_ASSUME).**
- RMB treats container contents like block drops: they are removed.
- Legendaries are always exempt and re-dropped (`L0-xcx10`).
- Item entities that were already on the ground before the blast are **not** removed. Only items that appear during the blast window inside the blast AABB are removed.

**Impact if wrong.**
- If the client wants chests to spill under RMB, suppression must whitelist container spills. That is a small change.
- If pre-existing ground items should also vanish, the snapshot logic flips.
