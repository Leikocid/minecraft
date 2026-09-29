---
type: "concept-entity"
node_id: "L0-ring-ent1"
source_channel: "rollout"
analysis_version: 3
title: "Entity · Ring Layout"
aliases: ["L0-ring-ent1"]
is_a: ["entity"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1129
tags: ["is_a:entity", "relates_to:L0-ring-p001", "relates_to:L0-ring-r001", "relates_to:L0-xasm8", "relates_to:L0-orbc-ent2"]
level: 2
---
# Entity · Ring Layout

**Links:** `part_of: ["L0-ring"]` · `is_a: ["entity"]` · `relates_to: ["L0-ring-p001", "L0-ring-r001", "L0-xasm8", "L0-orbc-ent2"]`

A pure value, computed once per RMB attack from the locked target by `layout(target)`. It is not persisted. `orbc` copies it into `Attack.charges` (`L0-orbc-ent2`).

| Attribute | Type | Notes |
|---|---|---|
| `centre` | `{x,z}` int | The target block's column. The hit face is ignored. |
| `rings` | `[{d, r, cells}]` | d ∈ {1,5,10,15,20}, r = d/2. `cells` is a list of `{dx,dz}` offsets. |
| `columns` | `{x,z}[]` | The union of all ring cells + centre, de-duplicated, in ring order then angle order. `slot` = index. |
| `count` | int | ≈ 141–161 (see `L0-ring-as06`). Hard cap `RING_MAX_CHARGES = 200`. |

**Invariants**
- d = 1 → exactly `{0,0}`.
- Each ring for d ≥ 5 is 8-connected and closed: every cell has exactly 2 ring neighbours in its 8-neighbourhood (no gaps, no spurs).
- |√(dx²+dz²) − r| ≤ 0.75 for every cell.
- No two columns coincide.
- The offsets are a constant table: the layout is identical for every target, and can be precomputed at module load.
