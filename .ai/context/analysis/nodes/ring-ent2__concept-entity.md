---
type: "concept-entity"
node_id: "L0-ring-ent2"
source_channel: "rollout"
analysis_version: 3
title: "Entity · Queued Blast"
aliases: ["L0-ring-ent2"]
is_a: ["entity"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1188
tags: ["is_a:entity", "relates_to:L0-ring-p002", "relates_to:L0-ring-p003", "relates_to:L0-ring-ad02"]
level: 2
---
# Entity · Queued Blast

**Links:** `part_of: ["L0-ring"]` · `is_a: ["entity"]` · `relates_to: ["L0-ring-p002", "L0-ring-p003", "L0-ring-ad02", "L0-orbc-r014"]`

An in-memory record created by each `onDetonate(…, "rmb")` call and consumed by the detonation queue (`p003`). It is never persisted: a restart drops it, as it drops in-flight charges (§11, `L0-orbc-p003`).

| Attribute | Type | Notes |
|---|---|---|
| `attackId` | string | From `orbc`. Used only for the report and logs. |
| `dimensionId` | string | From the `dim` argument |
| `point` | `{x,y,z}` int | The contact cell (`L0-orbc-r014`) |
| `centre` | Vector3 | From `L0-ring-r010` |
| `underwater` | bool | Evaluated at blast time, not enqueue time (`L0-ring-r007`) |
| `ownerId` | string | The explosion `source` is resolved at blast time (`L0-ring-r004`) |
| `enqueuedTick` | int | For the queue-age metric and the RG-2 check |

**Invariants**
- Each blast is consumed exactly once: it either explodes or is dropped because its cell is now unloaded (C-12, counted as lost).
- The queue is FIFO across all attacks and players, so a later attack never starves an earlier one.
- A blast never touches the owner's cooldown.
