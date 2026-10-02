---
type: "concept-entity"
node_id: "L0-sauc-ent2"
source_channel: "rollout"
analysis_version: 5
title: "Entity · SaucerState (in memory, `src/ufo/saucer.ts`)"
aliases: ["L0-sauc-ent2"]
is_a: ["entity"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1430
tags: ["is_a:entity", "runtime-state", "in-memory", "relates_to:L0-sauc-p001", "relates_to:L0-sauc-p002"]
level: 2
---
# Entity · SaucerState (in memory, `src/ufo/saucer.ts`)

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["entity"]` · `relates_to: ["L0-sauc-p001", "L0-sauc-p002", "L0-ufoc"]`

Nothing in it is persisted (C-23). It is rebuilt only by a new event.

| Attribute | Type | Notes |
|---|---|---|
| `eventId` | string | From `ufoc`. Key of the shoot-down latch. |
| `entity` | `Entity` | `andrew:ufo_saucer`. `isValid` is checked each tick. |
| `centre` | Vector3 | The block under the target at arrival start (`ufoc`). |
| `hoverY` | number | From `ufoc`. |
| `bearing` | radians | θ. The departure bearing is θ + π. |
| `leg` | `"arrival" \| "hover" \| "departure" \| "downed"` | The motion leg. The hover leg covers both magnet and release. |
| `legStartTick` | number | Taken from `ufoc`'s interval tick. |
| `pos` | Vector3 | The position last teleported to. It is what `saucerPosition()` returns and what the hull test uses. |
| `beamOn` | bool | Mirrors the actor property. |
| `nextHumTick` | number | |
| `downed` | bool | The latch. |
| `shooterId` / `shooterName` | string | Set at the latch. |
| `fallVy` / `fallStartTick` | number | `p002` step 5. |
| `unregister` | `() => void` | The interceptor handle (`p003`). |

**Invariants.**
- At most one `SaucerState` exists.
- `downed` implies that `shooterId` is set.
- If `entity` is invalid and not `downed`, the event aborts (`p001`).
- `pos` is horizontally ≤ 90 from `centre`.
