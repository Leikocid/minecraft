---
type: "concept-rule"
node_id: "L0-pntr-r007"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-r007"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 718
tags: ["title:Concurrent and overlapping columns are idempotent", "is_a:rule", "constraint:C-7′", "constraint:C-20", "relates_to:L0-pntr-p002"]
level: 2
---
**Rule R-pntr-7 · Concurrency.**
- Each LMB attack owns an independent job keyed by `attackId`. Jobs from different players, or from one player after the cooldown, may run at the same time and overlap in space.
- Removal is idempotent. A cell already turned to air or water is re-classified and skipped. A container already cleared yields no legendaries.
- The job keeps no shared mutable state between attacks and no world dynamic property. A column is never resumed after a restart (Orbital §11).
- With several players firing at once, the total cost of all running `pntr` jobs must stay inside C-5a′. `runJob` interleaves them, so each extra concurrent column adds latency and not a per-tick spike (`L0-pntr-cons`).
