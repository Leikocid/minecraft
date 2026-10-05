---
type: "concept-process"
node_id: "L0-sclk-p005"
source_channel: "rollout"
analysis_version: 7
title: "P-sclk-005 · Block hit: crater and sculk"
aliases: ["L0-sclk-p005"]
is_a: ["process"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1889
tags: ["process", "block-hit", "crater", "sculk", "C-27", "C-12"]
level: 2
---
# P-sclk-005 · Block hit: crater and sculk

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["process"]` · `relates_to: ["L0-adr-sctr", "L0-sclk-r003", "L0-sclk-r004", "L0-sclk-r010", "L0-sclk-ent4", "L0-xasm25", "L0-xcx25", "L0-sclk-ad04"]`

**Trigger.** `projectileHitBlock` for `andrew:sculk_bolt` with a live record. The record is claimed (deleted) first (C-26).

**Steps:**
1. `impact = hit.getBlockHit()`: the block and its `face`.
   - If the block is a liquid (only reachable through `includeLiquidBlocks` paths) or on the deny list (r010), carve nothing; sculk is still placed on the eligible cells around it.
2. **Plan** (pure, node-tested): `craterCells(impact, face, seed)` and `sculkCells(impact, face, crater, seed)` (`ent4`).
3. **Clip** (C-12, C-27): drop cells in unloaded chunks and cells outside `heightRange`.
4. `protectLegendariesIn(dimension, box)` over the union box, before any edit (`lgnd`, `recovery.ts`).
5. **Enqueue** the plan as one job: crater cells first, then sculk cells. The shared interval drains `CARVE_BUDGET_PER_TICK` (300) `setType` calls per tick across jobs, FIFO, preserving the order inside each job (`ad04`).
6. **Per crater cell:** skip it if it is air, a liquid or on the deny list; otherwise `setType("minecraft:air")`. There are no item drops, and containers spill as an engine fact (`xasm25`).
7. **Per sculk cell:** re-check at execution time that the cell is still a solid full block with air above it, then `setType("minecraft:sculk")`. Never a shrieker, sensor, catalyst or vein (§7).
8. `bolt.remove()`. Log `sculk: crater <n> cells, sculk <m> cells at <x y z> seed <s>`.

**Never.**
- `createExplosion` (`adr-sctr`).
- Damage to an entity, even one standing on the carved cells. Falling into the crater is ordinary fall damage, not weapon damage (T12, read as "no explosion damage").
- A rollback: the edits are permanent world changes.
