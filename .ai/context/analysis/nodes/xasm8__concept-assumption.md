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

**Gap.** Orbital §10 says the rings are "approximately 1/5/10/15/20 in diameter, as continuous as possible, discrete grid allowed".

**Assumption (CAN_ASSUME).**
- Rings are 8-connected midpoint circles of radius r = d/2 (0, 2.5, 5, 7.5, 10), centred on the target block's column.
- Duplicates are removed across rings.
- Diameter 1 is exactly one charge over the target.

That gives roughly 1 + 16 + 32 + 48 + 64 ≈ **160** charges per RMB. The budgets in C-5a′ and C-19 are sized for about 160 per attack and 3 concurrent attacks.

**Impact if wrong.** A sparser ring, for example 4-connected, halves the load. A denser, "thick" ring doubles it and may break the tick budget. This must be re-measured on BDS.
