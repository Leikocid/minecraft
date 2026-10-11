---
type: "concept-process"
node_id: "L0-trdt-pfbk"
source_channel: "rollout"
analysis_version: 9
title: "Process · Custody fallbacks and stale entities"
aliases: ["L0-trdt-pfbk"]
is_a: ["process"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 2675
tags: ["above-water-trident", "custody", "fallback", "lgnd-touch-points"]
level: 2
---
# Process · Custody fallbacks and stale entities

**Links.** is_a: process. relates_to: L0-xcx30, L0-trdt-adcl, L0-trdt-ecus, L0-lgnd-p001, L0-xasm36.

"Deliver" means calling `deliverToLastHolder(TRIDENT, record.mark, how)` (lgnd T2):
- it bumps the generation;
- if the holder is online and alive, it calls `grant` with the lgnd "recovered" message;
- otherwise it writes the owed ledger, which `redeemOwed` pays out on the next `playerSpawn`.

Each delivery deletes the record and removes the custody entity in the same sync block. For an unmarked Creative copy, "deliver" means: insert into the online, alive thrower; otherwise drop it at `record.last`.

| Trigger (checked each return tick, or by event) | Action | `how` |
|---|---|---|
| The owner is not among `getAllPlayers()`: logged off (`playerLeave`), or never rejoined | deliver, which writes owed | `thrower offline` |
| The owner's health ≤ 0 (died mid-flight; `entityDie` on the owner) | deliver, which writes owed and redeems after respawn | `thrower died` |
| The owner's dimension ≠ `record.dimension` | deliver directly, with a lang message | `thrower changed dimension` |
| `world.getEntity(entityId)` is undefined or invalid, or its chunk is not ticking | deliver | `custody entity unloaded` |
| `entityRemove` of a custody type not removed by us (Void, unload, `/kill`, explosion) | deliver on the next tick (before-events cannot write) | `custody entity removed` |
| `now − returnSince` > 30 s (owner outran it, e.g. elytra) | deliver | `return cap` |
| Script start (first tick): records left from before a restart | each record with no clone → deliver | `restart` |
| `entityLoad` or `entitySpawn` of a custody type whose `andrew:tr.throw` has no record, or whose record names another `entityId` | `entity.remove()`, log `stale` | — |
| A record whose mark `!isLive` | delete the record, remove the entity, no delivery | — |

**Why death needs no retention change.** While the copy is in custody, the slot is empty, so `retention.entityDie` stashes nothing. The owed ledger is the same durable, idempotent token retention uses, and `redeemOwed` drops an owed entry the player already carries.

**Why a restart cannot duplicate.**
- Delivery bumps the generation.
- A pre-restart entity that loads later either has no record (removed) or would only ever insert a stale mark (not inserted).
- A copy left in the hand by a crash mid-throw is stale after delivery, and `voidStaleSlot` removes it.

**Lava, fire, explosion.** A snowball-runtime entity is immune to damage (project measurement), so these only end custody through Void removal or unload. The copy itself is never on the ground in custody.
