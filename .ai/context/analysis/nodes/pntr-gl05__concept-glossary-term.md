---
type: "concept-glossary-term"
node_id: "L0-pntr-gl05"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 347
tags: ["title:Band mask", "is_a:glossary-term", "relates_to:L0-pntr-ad02"]
level: 2
---
**Band mask**

The 7×7 bit pattern that selects which `(x, z)` cells are removed for a *band* of 4 consecutive layers of the penetrator column. The 3×3 core is always set, and the rim is probabilistic. The pattern is drawn from a PRNG seeded by the attack id, so the same attack always gives the same shape.

**Related:** `ColumnPlan`, `attackId`.
