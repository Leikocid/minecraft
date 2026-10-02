---
type: "concept-rule"
node_id: "L0-sauc-r003"
source_channel: "rollout"
analysis_version: 5
title: "R-sauc-3 · Immune, unpushable, non-colliding (within the known engine traps)"
aliases: ["L0-sauc-r003"]
is_a: ["rule"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1498
tags: ["is_a:rule", "immunity", "engine-trap", "relates_to:L0-sauc-ent1"]
level: 2
---
# R-sauc-3 · Immune, unpushable, non-colliding (within the known engine traps)

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-ent1", "L0-sauc-ac02"]`

**Rule** (UFO §7, AC-16): nothing but an Orbital charge crossing the hull affects the saucer or the beam. Not damage, not knockback, not a push, not collision. The Cannon itself acts **only** through the script hull test (`r001`), never through entity damage.

**Required BP shape.** This is the same pattern as the shipped `orbital_charge.json` and the U-probe entities:
- `format_version` **1.26.0**. The 1.26.50 format drops `minecraft:pushable` and refuses the whole entity.
- `runtime_identifier: "minecraft:snowball"`. Without it, a custom entity pushes mobs.
- `collision_box` 0 × 0, so players cannot hit or target it and it does not block anything.
- `physics {has_gravity: false, has_collision: false}`.
- `pushable {is_pushable: false, is_pushable_by_piston: false}`.
- `knockback_resistance 1`.
- `damage_sensor {cause: "all", deals_damage: "no"}`.
- No `health` component and no `projectile` component.
- `is_spawnable false`. `is_summonable true` for tests only.

**Consequences.**
- Arrows, tridents, TNT and other explosions, lightning, lava, fire, and the `/damage` command change nothing.
- `/kill` and `/andrew:ufo stop` are removals, not damage. They fall outside AC-16 and are handled as an aborted event (`p001`).
- Charges are never stopped by the entity. They are stopped by the interceptor.
