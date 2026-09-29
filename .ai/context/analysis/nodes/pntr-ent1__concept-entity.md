---
type: "concept-entity"
node_id: "L0-pntr-ent1"
source_channel: "rollout"
analysis_version: 3
title: "ColumnPlan (transient, in memory only)"
aliases: ["L0-pntr-ent1"]
is_a: ["entity"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1063
tags: ["title:ColumnPlan", "is_a:entity", "transient", "relates_to:L0-pntr-p001", "relates_to:L0-pntr-r001"]
level: 2
---
# ColumnPlan (transient, in memory only)

| Attribute | Type | Meaning |
|---|---|---|
| `attackId` | string | Comes from `orbc`. It is unique per activation and seeds the PRNG. |
| `dimensionId` | string | `minecraft:overworld` / `nether` / `the_end`. |
| `cx`, `cz` | int | The column centre, which is the detonation cell's x/z. |
| `top` | int | The detonation cell's y (inclusive). |
| `bottom` | int | `heightRange.min` at planning time (inclusive). |
| `bandHeight` | int | 4, the number of layers that share one mask. |
| `masks` | `Uint8Array[]` | One 49-bit (7×7) mask per band, indexed by `(top − y) / bandHeight`. |
| `ownerId` | string | For logging only. The effect never uses it to pick damage targets. |

**Derived values.** `height = top − bottom + 1`. The number of cells is the sum of the mask popcounts per layer, about 25·height (Overworld worst case ≈ 9,600; typical surface ≈ 3,500; Nether ≤ 3,200).

**Lifecycle.** It is created in P-pntr-1 and discarded when both jobs end. It is never persisted: after a restart the column is not resumed.
