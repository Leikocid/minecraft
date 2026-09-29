---
type: "concept-entity"
node_id: "L0-orbc-ent3"
source_channel: "rollout"
analysis_version: 3
title: "Entity · Orbital Charge (`andrew:orbital_charge`)"
aliases: ["L0-orbc-ent3"]
is_a: ["entity"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1639
tags: ["is_a:entity", "relates_to:L0-adr-ochg", "relates_to:L0-orbc-ad02", "relates_to:L0-orbc-r008", "relates_to:L0-orbc-p002"]
level: 2
---
# Entity · Orbital Charge (`andrew:orbital_charge`)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-ochg", "L0-orbc-ad02", "L0-orbc-r008", "L0-orbc-p002"]`

## Pack definition
**Behavior pack** (`entities/orbital_charge.json`):
- `is_summonable: true`, `is_spawnable: false`, no spawn egg.
- `minecraft:collision_box` 0×0 (entities pass through).
- `minecraft:physics` with `has_gravity: false, has_collision: false`.
- `minecraft:pushable {is_pushable:false, is_pushable_by_piston:false}`, `knockback_resistance 1`.
- `minecraft:damage_sensor` that ignores all damage, so blasts cannot destroy it.
- No `minecraft:persistent`. It is not a mob, so it never naturally despawns (see memory "nameTag ≠ despawn protection"). Cleanup is scripted (`p003`).

**Resource pack** (`entity/orbital_charge.entity.json`):
- The vanilla TNT block geometry and texture.
- Scale through a property `andrew:scale` (int enum `0=rmb 1.0`, `1=lmb 1.2`), read in the render controller.
- The RP is needed only for this visual (§12, "RP only if needed").

## Script state (in memory, per charge)
| Attribute | Notes |
|---|---|
| `entity` | An `Entity` ref. `isValid` is false after an unload → lost (`r011`). |
| `attackId` | Also set as the entity tag `andrew:oc_attack:<id>`, plus the static tag `andrew:oc_charge` |
| `x, z` | Block-column centre (+0.5). Constant. |
| `y` | The current feet Y. It decreases by `FALL_SPEED` each tick (`as02`). |
| `slot` | Index within the attack (RMB ring position) |

**Lifecycle:** spawned → falling → one of: detonated | voided | lost | timed-out → removed. It never re-enters "falling".
