---
type: "concept-entity"
node_id: "L0-uwbw-esfr"
source_channel: "rollout"
analysis_version: 10
title: "E-uwbw-sfr · Super Fire status"
aliases: ["L0-uwbw-esfr"]
is_a: ["entity"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1675
tags: ["v10", "underwater-bow", "super-fire", "entity"]
level: 2
---
# E-uwbw-sfr · Super Fire status

**Links.** relates_to: L0-adr-ubfl, C-43, L0-uwbw-r002.

**Record (in memory, plus a world dynamic property for restart):**

| Field | Meaning |
|---|---|
| `targetId` | entity id |
| `untilTick` | start + 100 |
| `nextTick` | the next 1 HP burn tick (every 20 ticks) |
| `sourceId` | the shooter, for kill credit |

**Lifecycle.**
- **Start:** the armed hit's after-event sets `untilTick = now + 100`. A second armed hit **refreshes** `untilTick` and never stacks a second record.
- **Each tick** (the one shared `runInterval`; no `runJob`):
  - if the target is invalid or dead, drop the record;
  - when `now ≥ nextTick`: if the target has neither Fire Resistance nor a fire-immune type, deal 1 HP with cause `fireTick` through `applyScriptedDamage` (marked as scripted); then `nextTick += 20`;
  - out of water, re-apply `setOnFire(1)` for the flame visual;
  - in water, spawn flame/smoke particles at the body instead.
- **End:** at `untilTick`, the record is dropped. The scripted burn adds no damage after 5 s.

**Invariants.**
- 5 ticks of burn, 5 HP in total, in water or out, before armour (`fireTick` ignores armour as vanilla does).
- No fire block is ever placed.
- Ends early only on death or removal.
- A restart within the 5 s resumes from the stored `untilTick`; a record for an entity that is not loaded expires by tick.

**Overlap with vanilla fire.** The vanilla flame visual can also burn the target. Super Fire suppresses double damage within its window: a `fireTick` or `onFire` hurt before-event on a target with a live record that is **not** scripted is cancelled. The burn is therefore exactly the scripted 1 HP/s.
