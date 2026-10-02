---
type: "concept-acceptance-criterion"
node_id: "L0-sauc-ac02"
source_channel: "rollout"
analysis_version: 5
title: "AC-sauc-2 (bds · UFO AC-16) · Nothing but the Cannon affects the saucer or the beam"
aliases: ["L0-sauc-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1017
tags: ["is_a:acceptance-criterion", "channel:bds", "UFO-AC-16", "relates_to:L0-sauc-r003"]
level: 2
---
# AC-sauc-2 (bds · UFO AC-16) · Nothing but the Cannon affects the saucer or the beam

**GIVEN** a hovering saucer with the beam on, and 2 simulated players.

**WHEN** the following are applied to it in turn:
1. `entity.applyDamage(1000, {cause})` for every `EntityDamageCause`;
2. `/damage @e[type=andrew:ufo_saucer] 100`;
3. `dimension.createExplosion` at its position (power 4);
4. an arrow fired through the disc;
5. a zombie spawned overlapping the hull, and a player teleported into it;
6. a stone wall placed across the departure path.

**THEN**
- After each one, the saucer is valid and its position equals the scripted path position (Δ < 0.01). No knockback.
- The zombie and the player are not displaced by the saucer (Δ < 0.05 over 20 ticks).
- The saucer passes through the wall on schedule, and the wall is unchanged.
- `downed` stays false, and there is no reward and no broadcast.

**Control:** an Orbital charge whose column crosses the hull in the same scenario *does* shoot the saucer down (`ac03`).
