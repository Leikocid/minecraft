---
type: "concept-rule"
node_id: "L0-pntr-r008"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-r008"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 694
tags: ["title:Skip unloaded cells; never force-load", "is_a:rule", "constraint:C-14", "relates_to:L0-orbc", "relates_to:L0-pntr-p002"]
level: 2
---
**Rule R-pntr-8 · Unloaded chunks are skipped.**
- A column is at most 7×7, so it can straddle up to 4 chunks. The detonation chunk is loaded, because the charge was in it, but a neighbour may not be (at the edge of simulation distance).
- Cells whose chunk is not loaded are skipped and counted in the job report. There is no ticking area, force-load or retry (C-14; Orbital §11: "not required to keep chunks loaded").
- If the dimension or chunk unloads mid-job, the remaining cells are abandoned. The column may end up partial, which the spec accepts as equivalent to "charges lost". The cooldown is not refunded (C-17).
- Particles and the sound towards unloaded cells are try/catch no-ops.
