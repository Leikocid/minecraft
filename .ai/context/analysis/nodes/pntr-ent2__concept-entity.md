---
type: "concept-entity"
node_id: "L0-pntr-ent2"
source_channel: "rollout"
analysis_version: 5
title: "PenetratorJob (transient)"
aliases: ["L0-pntr-ent2"]
is_a: ["entity"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 831
tags: ["title:PenetratorJob and report", "is_a:entity", "transient", "relates_to:L0-pntr-p002", "relates_to:L0-pntr-p003"]
level: 2
---
# PenetratorJob (transient)

There are two `system.runJob` generators per attack: **removal** and **wave**.

| Attribute | Meaning |
|---|---|
| `attackId` | The key. It is also used in log lines and gametest hooks. |
| `cursorY`, `cursorCell` | The removal job's progress, from top to bottom. |
| `waveTick` | 0…19 for the particle job. |
| `startedTick` | The `system.currentTick` at detonation. |
| `report` | `{scanned, removed, kept, keptProtectFailed, skippedUnloaded, containersCleared, legendariesProtected, ticksUsed}` |

**Invariants.**
- At most 2 jobs per attack, and both end on their own.
- Neither job spawns entities or writes dynamic properties.
- After the removal job ends, `report.ticksUsed` is compared with the budget in `L0-pntr-cons` and a warning is logged if it is exceeded. This is what the bds ACs read.
