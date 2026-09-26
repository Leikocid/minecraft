---
type: "concept-entity"
node_id: "L0-wind-e004"
source_channel: "rollout"
analysis_version: 2
title: "Entity — `SitePrepPlan` (transient, reproducible)"
aliases: ["L0-wind-e004"]
is_a: ["entity"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1497
tags: ["is_a:entity", "transient", "site-prep", "relates_to:L0-wind-p003", "relates_to:L0-wind-r009", "relates_to:L0-wind-r010"]
level: 2
---
# Entity — `SitePrepPlan` (transient, reproducible)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-wind-p003, L0-wind-r008, L0-wind-r009, L0-wind-r010, L0-wind-as03, L0-wind-as04, L0-wind-as05]`

Computed in memory from the chosen origin/rotation and the current terrain. Only its hash is persisted (`L0-wind-e002.plan`); after a restart the plan is recomputed and must hash identically, otherwise (terrain changed meanwhile) it is re-validated from scratch.

```ts
interface SitePrepPlan {
  origin: Vec3; rot: 0|1|2|3;
  targetY: number;                 // median natural surface of the 35×35 plot
  plot: AABB2;                     // rotated 35×35
  band: number;                    // blend band width B (L0-wind-as03)
  columns: Array<{
    x: number; z: number;
    naturalY: number;              // first non-leaf/log solid
    surfaceBlock: string;          // reused for the new top layer
    cutTo?: number;                // clear blocks above this Y
    fillFrom?: number;             // fill air/liquid from here up to target (≤ D deep, L0-wind-as04)
    zone: "plot" | "band";
  }>;
  score: number;                   // cut + fill volume + penalties (L0-wind-as05)
}
```

## Invariants
- Every block the plan would change is on the natural whitelist (`L0-wind-r008`); the plan is rejected otherwise, before any write.
- In the band, `|y(col) − y(neighbour)| ≤ 1` after smoothing (`L0-wind-r009`).
- `fillFrom ≥ targetY − D` everywhere (`L0-wind-r010`).
