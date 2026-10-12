---
type: "concept-entity"
node_id: "L0-pear-ent1"
source_channel: "rollout"
analysis_version: 11
title: "Pearl Rod item and its binding record"
aliases: ["L0-pear-ent1"]
is_a: ["entity"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 2753
tags: ["v11", "pearl-rod", "entity", "dynamic-properties"]
level: 2
---
# Pearl Rod item and its binding record

**Is a:** entity. **Part of:** L0-pear. **Relates to:** L0-adr-prbd, L0-xasm42, L0-pear-ent2, L0-pear-ru03.

## The item
- **Type:** `minecraft:fishing_rod`, a real vanilla rod (C-16: real fishing, loot, Lure, Luck of the Sea and Mending are kept). Max stack 1, so ItemStack dynamic properties are allowed.
- **Mark:** dynamic property `andrew:pearl_rod` = a rod id (a fresh random string at the swap). A rod with this property is a Pearl Rod; nothing else is.
- **Name:** `nameTag` = «Перовый сокровятель» (default per `xq12` item 2).
- **Lore:**
  - line 1: `Pearl Rod`;
  - line 2: `bound: <overworld|nether|the_end> x y z` or `unbound`. The owner's name is never shown (`xasm42`).
- **Durability:** `durability.damage` is held at 0 (rule `L0-pear-ru04`).
- **World rules:** it drops on death and despawns, burns and breaks like any vanilla item. It never matches `lgnd` `defForToken`, `defForStack` or `isLegendaryStack` or any retention or Void hook (C-46).

## The binding record (rod dynamic properties)
| Property | Type | Meaning |
|---|---|---|
| `andrew:pr_dim` | string | dimension id of the plate |
| `andrew:pr_pos` | Vector3 | the plate's block cell (integer x, y, z), **not** the support block |
| `andrew:pr_type` | string | the plate typeId at bind time (any `*pressure_plate`) |
| `andrew:pr_owner` | string | `player.id` of the binder |
| `andrew:pr_epoch` | number | the binder's `andrew:life_epoch` at bind time (C-45) |
| `andrew:pr_gen` | number | the plate generation at that cell at bind time (`L0-pear-ent2`) |

- **States:** *unbound* (none of these set) and *bound* (all set). A partial record reads as unbound and is cleared at the next write.
- **Transitions:**
  - unbound → bound: the hook enters a plate cell (`L0-pear-pr02`);
  - bound → bound: anyone's hook from this rod binds again, which **overwrites** the record;
  - bound → unbound: a successful teleport, or the plate is missing, changed, or its generation was bumped (`L0-pear-ru01`);
  - bound → stays bound: a timeout, a full area pool, no safe spot, or a dimension refused.
- **Epoch void:** an epoch mismatch does not erase the record. The record is simply not honoured. It is overwritten by the next binding.

## Persistence
- Item dynamic properties travel with the stack through inventories, chests, drops and a restart.
- Survival of an anvil rename or combine, and of a reel, is a probe question (`L0-pear-ac07`). If one of them drops the mark, that is a reported limitation.

## Runtime-only state (not persisted)
- Tracked hooks: `hookId → {playerId, rodId, castTick}`.
- Pending teleports: `playerId → {rodId, areaSlot, deadlineTick}`. These are lost on a restart, which is safe because the binding is cleared only on success.
