---
type: "concept-entity"
node_id: "L0-sclk-ent2"
source_channel: "rollout"
analysis_version: 7
title: "E-sclk-2 · Entity `andrew:sculk_bolt`"
aliases: ["L0-sclk-ent2"]
is_a: ["entity"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1463
tags: ["entity", "bolt", "projectile", "snowball-runtime"]
level: 2
---
# E-sclk-2 · Entity `andrew:sculk_bolt`

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-scdm", "L0-sclk-as01", "L0-sclk-p002", "L0-sclk-p003"]`

The BP is `packs/behavior/entities/sculk_bolt.json`, format 1.26.0 like `orbital_charge.json`. It must not use `minecraft:pushable`, which was dropped in 1.26.50 and makes the engine refuse the whole entity.

| Component | Value |
|---|---|
| `runtime_identifier` | `minecraft:snowball`. Without it the entity pushes mobs (engine fact) |
| `is_spawnable` / `is_summonable` | false / true (tests summon it) |
| `minecraft:projectile` | `on_hit: {remove_on_hit: {}}` is **absent**: the script removes the bolt after resolving it. `power` 0, `gravity` and `inertia` from the probe (`as01`), `uncertainty_base` 0, `anchor` 1, `offset` [0,0,0], no `impact_damage` (zero damage) |
| `minecraft:collision_box` | 0.25 × 0.25 |
| `minecraft:physics` | {} |
| `minecraft:damage_sensor` | all causes → `deals_damage: no` |
| despawn | none in JSON; the script's lifetime cap (100 ticks) rules |

**RP.** `packs/resource/entity/sculk_bolt.entity.json`: a small teal arrow-like quad, or invisible with the trail carrying the look (ad02, iPad check).

**Runtime facts it inherits.**
- Snowball-runtime entities persist and reload through `entityLoad`; a reloaded bolt has no record and is removed (C-23).
- The entity ray stops at blocks. Bolt hits come from the projectile component, not from rays.
