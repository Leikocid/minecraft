---
type: "concept-entity"
node_id: "L0-ufoc-ent1"
source_channel: "rollout"
analysis_version: 5
title: "E-ufoc-1 · UFO durable schedule state (world dynamic properties)"
aliases: ["L0-ufoc-ent1"]
is_a: ["entity"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1353
tags: ["is_a:entity", "durable-state", "relates_to:L0-adr-ufom", "relates_to:L0-ufoc-ad03", "relates_to:L0-ufoc-cx01"]
level: 2
---
# E-ufoc-1 · UFO durable schedule state (world dynamic properties)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-ufom", "L0-ufoc-ad03", "L0-ufoc-cx01", "L0-ufoc-r001"]`

This is the only UFO state that survives a restart (C-23, `L0-adr-ufom` §2).

| Property | Type | Values | Meaning |
|---|---|---|---|
| `andrew:ufo_next_ms` | number | absent | No first join seen yet (`L0-xasm14`). The next `initialSpawn` writes now + U(10, 20) min. |
| | | `> 0` | Epoch ms (`Date.now()`) of the next arrival. A value in the past means "due"; the event waits for an Overworld player. |
| | | `0` | The **in-flight marker** (`ad03`): an event is live. It is written at arrival start and replaced with now + 15 min when the event ends. |
| `andrew:ufo_enabled` | boolean | absent or `true` | The event runs. The default is on (UFO §9). |
| | | `false` | No automatic arrival. Written by `/andrew:ufo disable`. |

**Invariants**
- `next_ms` is written only by `ufoc`, in `schedule.ts`.
- Every event end path (pause, downed, stop, abort, restart) writes `next_ms = now() + PAUSE_MS`, where `PAUSE_MS` = 900 000 (`r001`).
- Neither property holds anything about a phase, the centre or the target. That information lives in `ent2`, in memory only.
- Writes go through the `DynamicPropertyStore` already used by `strf` in `src/main.ts`.
