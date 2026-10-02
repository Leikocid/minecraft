---
type: "concept-process"
node_id: "L0-strf-p004"
source_channel: "rollout"
analysis_version: 5
title: "Process — idempotent first initialisation of an instance"
aliases: ["L0-strf-p004"]
is_a: ["process"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 2168
tags: ["is_a:process", "idempotency", "first-init", "relates_to:L0-loot", "relates_to:L0-strf-r008", "relates_to:L0-strf-r009", "relates_to:L0-strf-e002"]
level: 2
---
# Process — idempotent first initialisation of an instance

**Links:** `part_of: ["L0-strf"]` · `is_a: ["process"]`

**State machine** (a field of `InstanceRecord`; every transition is persisted before the next step starts):
`planned → placed → looted → guarded → done`. `failed` is terminal.

| Step | Action | Idempotency mechanism |
|---|---|---|
| placed → looted | For each `def.chests[i]`, transform the local point by `rot` (`L0-strf-r004`), get `minecraft:inventory`, then call `loot.fillChest(instanceId, i, def.chests[i].table)`. | The fill is **deterministic** (seed = `hash(salt, instanceId, i)`) and writes fixed slots via `container.setItem`. A re-run after a crash rewrites identical stacks. It runs only while the state is `placed`, so a chest that was already looted is never refilled. |
| looted → guarded | `def.spawnGuards(ctx)` returns a list of `{type, localPos, count}`. `strf` spawns each entity, adds the tag `andrew:guard:<instanceId>`, and sets `nameTag` plus any per-def effects (`L0-strf-r009`). | Before spawning, count the entities in the instance AABB (+8) that carry the tag, and spawn only the deficit. This covers a crash between spawn and persist. Once the state is `guarded`, it never spawns again, so deaths do not reset it (§6 "initial guards spawned"). |
| guarded → done | `def.afterInit(ctx)` handles body extras: the Warden City surface marker and the Bastion gold blocks. The count of gold blocks is seeded. | The hook must be idempotent: it writes fixed positions, and setting the same permutation twice is a no-op. |

Defs without guards or chests skip the corresponding step, but the state still advances.

**Precondition for every step.** Every chunk under the AABB is loaded. If not, the step is deferred (the record keeps its state) and resumed when the instance chunk is next seen by discovery.

**Never**
- Re-run a step whose state is already past it.
- Detect "already initialised" by scanning blocks or marker entities. Players can destroy those (`L0-adr-strs`).
- Clear a chest before filling it outside the `placed` state.

**Existing-world install (secondary scenario).** Identical. There is no separate path.
