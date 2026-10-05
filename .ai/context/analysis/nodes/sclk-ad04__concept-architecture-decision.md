---
type: "concept-architecture-decision"
node_id: "L0-sclk-ad04"
source_channel: "rollout"
analysis_version: 7
title: "AD-sclk-04 · Terrain edits through a budgeted FIFO on the shared interval"
aliases: ["L0-sclk-ad04"]
is_a: ["architecture-decision"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1117
tags: ["architecture-decision", "performance", "carve-queue", "C-5f"]
level: 2
---
# AD-sclk-04 · Terrain edits through a budgeted FIFO on the shared interval

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-adr-sctr", "L0-sclk-ent4", "L0-sclk-p005"]`

**Context.** One bolt edits ≤ 100 cells. A Multishot volley with Quick Charge III is about 3 bolts every 0.5 s per player, and several players can shoot at once. `setType` in a hit handler is synchronous.

**Decision.**
- Plan in the hit tick: pure and cheap.
- `protectLegendariesIn` runs in the hit tick, before anything is queued.
- Writes drain from a FIFO at ≤ 300 per tick on the shared interval. A single volley (≤ 300 writes) still lands in the hit tick.

**Rejected.**
- **All writes inline in the hit handler.** That is unbounded per tick when several players fire.
- **`system.runJob`.** It stalls the next tick by 15–30 ms (engine fact).
- **One `/fill` per layer.** Rectangles cannot express the irregular shape, and `fill` ignores the deny list.

**Risk.** Under a long overload a queued crater can land several ticks late. That is acceptable, because §11 asks only for synced, saved edits.
