---
type: "concept-rule"
node_id: "L0-webs-r003"
source_channel: "rollout"
analysis_version: 1
level: 2
aliases: ["L0-webs-r003"]
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 526
tags: ["rule", "trap", "geometry"]
---
---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent3", "L0-webs-r002"]
---
**Rule (R-webs-003 — Cube geometry, Q-011).** The trap volume is exactly 27 cells: a 3×3×3 cube centered on the resolved target cell (`L0-webs-r002`), inclusive of the center. All 27 cells are candidates for replacement; none are excluded by geometry alone (only by `L0-webs-r004`'s filter).

**Rationale.** Spec §5 ("куб... 3×3×3"); the exact cell count and centering rule were ambiguous in the raw spec until closed by decision Q-011.
