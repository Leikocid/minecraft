---
type: "concept-assumption"
node_id: "L0-xasm8"
source_channel: "rollout"
analysis_version: 3
title: "ASM-L0-8 · Ring rasterisation and charge count"
aliases: ["L0-xasm8"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0", "L0-ring"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
priority: 540
size_chars: 761
tags: ["title:ASM-L0-8 · Ring rasterisation and charge count", "alias:L0-xasm8", "is_a:assumption", "relates_to:L0", "relates_to:L0-ring", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "CAN_ASSUME"]
level: 1
---
# ASM-L0-8 · Ring rasterisation and charge count

**Gap.** Orbital §10 says the rings are "approximately 1/7/14/21/28 in diameter, as continuous as possible, discrete grid allowed" (decision 2026-09-30).

**Assumption (CAN_ASSUME).**
- Rings are 8-connected midpoint circles of radius r = d/2 (0.5, 3.5, 7, 10.5, 14), centred on the target block's column.
- Duplicates are removed across rings.
- Diameter 1 is exactly one charge over the target.

That gives 1 + 20 + 40 + 60 + 80 = **201** charges per RMB (measured). The budgets in C-5a′ and C-19 are sized for 201 per attack and 3 concurrent attacks.

**Impact if wrong.** A sparser ring, for example 4-connected, halves the load. A denser, "thick" ring doubles it and may break the tick budget. This must be re-measured on BDS.
