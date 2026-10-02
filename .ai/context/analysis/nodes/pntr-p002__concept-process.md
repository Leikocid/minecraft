---
type: "concept-process"
node_id: "L0-pntr-p002"
source_channel: "rollout"
analysis_version: 5
title: "P-pntr-2 · Batched top-down removal job"
aliases: ["L0-pntr-p002"]
is_a: ["process"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 2222
tags: ["title:Batched top-down removal job", "is_a:process", "relates_to:L0-pntr-ad01", "relates_to:L0-pntr-r002", "relates_to:L0-pntr-r003", "relates_to:L0-pntr-r004", "relates_to:L0-pntr-r005", "relates_to:L0-pntr-r008", "relates_to:L0-pntr-cons"]
level: 2
---
# P-pntr-2 · Batched top-down removal job

**Trigger.** Step 5 of P-pntr-1. There is one `system.runJob` generator per attack, and it ends by itself (C-5a′).

**Per layer, from `top` down to `bottom`, for each masked `(x, z)` cell:**
1. `block = dim.getBlock(pos)`. If the chunk is unloaded (it returns `undefined` or throws `LocationInUnloadedChunkError`), **skip the cell** and count it. Never force-load (C-14, `L0-pntr-r008`).
2. Classify (`L0-pntr-ent3`):
   - air → skip;
   - liquid (`water`, `flowing_water`, `lava`, `flowing_lava`) → keep;
   - on the `xasm6` deny list → keep;
   - otherwise → remove.
3. **Remove path:**
   a. If the block has `minecraft:inventory` (chest, trapped chest, barrel, placed shulker box, hopper, dropper, dispenser, furnaces, brewing stand, crafter and so on): synchronously call `lgnd.protectLegendariesIn(dim, cellVolume)`, then `container.clearAll()`, then `setType("minecraft:air")`. These happen in one step with no yield between them (`L0-pntr-r005`).
   b. Else if `block.isWaterlogged`: `setType("minecraft:water")`. The solid part goes, the liquid stays (`L0-pntr-as04`).
   c. Else: `setType("minecraft:air")`.
4. Every N cells, `yield`. N is tuned so the job stays inside C-5a′ (starting value 512, `L0-pntr-cons`).

**Termination.**
- The job ends after the bottom layer. It writes a report `{attackId, scanned, removed, kept, skippedUnloaded, ticks}` to the debug log/gametest hook.
- If the dimension becomes invalid (for example on server stop), the generator returns. Nothing is persisted: an in-flight column is abandoned on restart, just like in-flight charges (Orbital §11). The cooldown is never refunded (C-17).

**Ordering rationale.**
- Top-down makes the part the player can see disappear first, in the detonation tick.
- Liquids above the shaft start flowing as soon as their support goes (Orbital §9, `L0-pntr-as07`).

**Concurrency.**
- Two overlapping columns (two players, or the same player after the cooldown) are safe. A cell already turned to air is skipped.
- A container that the other job already cleared has no legendaries left.
- Two jobs never write the same container in the same step, because runJob generators are interleaved, not parallel.
