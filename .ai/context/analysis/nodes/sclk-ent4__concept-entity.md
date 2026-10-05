---
type: "concept-entity"
node_id: "L0-sclk-ent4"
source_channel: "rollout"
analysis_version: 7
title: "E-sclk-4 · Carve plan and carve queue"
aliases: ["L0-sclk-ent4"]
is_a: ["entity"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1142
tags: ["entity", "carve-plan", "queue", "pure"]
level: 2
---
# E-sclk-4 · Carve plan and carve queue

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-sclk-r003", "L0-sclk-r004", "L0-sclk-ad04", "L0-adr-sctr"]`

**`CarvePlan`** (pure, `src/sculk/crater-plan.ts`, node-tested with no `@minecraft/server`):

| Field | Meaning |
|---|---|
| `kind` | `"crater"` (block hit) or `"patch"` (entity hit) |
| `origin` | the impact cell or the feet column |
| `face` | the hit face (`Up`/`Down`/`North`/…); `Up` for a patch |
| `seed` | from `BoltRecord.seed` |
| `air` | `Vector3[]`, ≤ 75 cells inside 5×5×3 (empty for a patch) |
| `sculk` | `Vector3[]`, ≤ 25 candidate cells inside 5×5 |
| `box` | the union AABB, for the `protectLegendariesIn` call and the clip |

The planner sees only a `BlockProbe` callback (`isSolidFull`, `isAirLike`, `isKeep`, `isLiquid`). The runtime builds it from `Block` and `TERRAIN_KEEP`, and tests use a fixture grid.

**`CarveJob`** (runtime, `src/sculk/carve.ts`): `{plan, dimension, cursor}` in a FIFO. The shared interval drains up to `CARVE_BUDGET_PER_TICK` = 300 `setType` calls per tick. Before each write, a cell in an unloaded chunk is skipped.
