---
type: "concept-entity"
node_id: "L0-trdt-ecus"
source_channel: "rollout"
analysis_version: 9
title: "Custody record (`andrew:tr.custody`)"
aliases: ["L0-trdt-ecus"]
is_a: ["entity"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1945
tags: ["above-water-trident", "custody", "persistence"]
level: 2
---
# Custody record (`andrew:tr.custody`)

**Links.** is_a: entity. relates_to: L0-trdt-adcl, L0-trdt-pthr, L0-trdt-pfbk, L0-lgnd-ent1.

**Storage.**
- A world dynamic property holding a JSON map `throwId → record`.
- It is written only by `src/trident/custody.ts`.
- There are several entries at once only when Creative copies are thrown. At most one entry is marked, because the world has one live instance.

| Attribute | Type | Meaning |
|---|---|---|
| `throwId` | string | `${absoluteTime}-${random}`. The custody entity carries the same string as the entity dynamic property `andrew:tr.throw`. |
| `owner` / `ownerName` | string | The thrower's id and name. Delivery goes to `mark.holder` via lgnd, which is the thrower, stamped when the copy arrived in their slot. |
| `mark` | `Mark` or absent | `withLook(getMark(def, stack), stack)`, which includes the enchantments, name tag and lore. Absent = an unmarked Creative copy. |
| `state` | `flying` or `returning` | |
| `entityId` | string or absent | The current custody entity. Absent only inside the throw's sync block. |
| `dimension` | string | The dimension id of the entity. |
| `last` | Vector3 | The entity position, refreshed every 20 ticks (used to drop an unmarked copy). |
| `since` / `returnSince` | number | `world.getAbsoluteTime()` at the throw and at the start of the return. Absolute time survives a restart; `system.currentTick` does not. |

**In-memory companion:** `Map<throwId, ItemStack>`, the exact thrown stack used for a normal return. It is lost on restart, and a record without a clone always goes through the fallback delivery.

**Invariants.**
- A record exists if and only if the copy is in custody.
- It is deleted in the same sync block as the insert or the `deliverToLastHolder` call.
- A custody entity whose `andrew:tr.throw` has no record is stale and is removed on sight.
- A record whose mark is not live (`isLive` false) is deleted without delivery.
