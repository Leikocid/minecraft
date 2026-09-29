---
type: "concept-process"
node_id: "L0-pntr-p001"
source_channel: "rollout"
analysis_version: 3
title: "P-pntr-1 · Detonation → column plan"
aliases: ["L0-pntr-p001"]
is_a: ["process"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1871
tags: ["title:Detonation → column plan", "is_a:process", "relates_to:L0-orbc", "relates_to:L0-pntr-r001", "relates_to:L0-pntr-ent1", "relates_to:L0-pntr-ad02"]
level: 2
---
# P-pntr-1 · Detonation → column plan

**Trigger.** `orbc` calls `onDetonate(dim, point, ownerId, "lmb")` in the tick the charge touches a solid cell, or in its spawn tick if it spawned inside one. `orbc` removes the charge entity. `pntr` does not.

**Steps (synchronous, in the detonation tick):**
1. `top = floor(point)`. The detonation cell itself is the top layer. Nothing above it is touched.
2. `bottom = dim.heightRange.min` (Overworld −64, Nether 0, End 0). The column is inclusive of `bottom`.
3. Seed a PRNG from `attackId` (`L0-pntr-ad02`) and build a `ColumnPlan` (`L0-pntr-ent1`). For each band of 4 layers there is one 7×7 bit mask centred on `(x, z)` of the detonation cell. The 3×3 core is always set, the rest of the 5×5 is mostly set, and the 7×7 rim occasionally is.
4. Play the single explosion sound at `point` (`L0-pntr-p003`). This comes **before** any removal so the audio matches the moment of impact.
5. Start the removal job (`L0-pntr-p002`) and the particle job (`L0-pntr-p003`). Both are keyed by `attackId`.

**Invariants.**
- The plan is pure: the same `attackId`, `point` and `heightRange` give the same cells. Gametests rely on this.
- The plan never depends on what the blocks are. Classification happens per cell in P-pntr-2, so a kept cell (bedrock, water) never shortens the column (`L0-pntr-r002`).
- No world reads happen in this step, so planning cannot hit an unloaded chunk.

**Edge cases.**
- Detonation at or below `bottom`: the column has one layer.
- End void: most cells are air and are skipped cheaply in P-pntr-2.
- Nether roof: a charge spawned inside the ceiling bedrock at y=127 starts the column there. The bedrock stays (keep list), and the netherrack below it is removed.
- The target block that `orbc` locked is irrelevant here. Only the actual detonation point counts (Orbital §9, "from the actual trigger point").
