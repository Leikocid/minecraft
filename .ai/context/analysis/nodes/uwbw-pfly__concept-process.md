---
type: "concept-process"
node_id: "L0-uwbw-pfly"
source_channel: "rollout"
analysis_version: 10
title: "P-uwbw-fly · From the shot to the arrow's flight"
aliases: ["L0-uwbw-pfly"]
is_a: ["process"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 2003
tags: ["v10", "underwater-bow", "flight", "process"]
level: 2
---
# P-uwbw-fly · From the shot to the arrow's flight

**Links.** relates_to: L0-sclk, L0-uwbw-adfl, C-42, L0-uwbw-earm.

1. **Draw.** The player draws with Use, as with a vanilla bow. Sneak at the start of Use goes to `L0-uwbw-parm` first; the draw itself is never cancelled.
2. **Release.** The engine spawns a `minecraft:arrow` from the shooter, with the draw-scaled velocity and crit flag. There is no `projectileShoot` event in 2.10.0.
3. **Attribute.** In `world.afterEvents.entitySpawn` (the same tick), an arrow is attributed to this bow when:
   - its projectile owner is a player; **and**
   - that player's main hand (or off hand, if allowed) holds `andrew:underwater_bow`; **and**
   - the arrow's spawn point is within 2 blocks of the player's eye.

   Arrows from other bows, dispensers and skeletons are ignored.
4. **Mark.**
   - **Variant A (swap).** The arrow is removed and `andrew:underwater_arrow` is spawned at the same point with the same velocity (+0 swap). The swap copies the owner, crit, Flame/Punch/Power levels, potion data and the pickup rule.
   - **Variant B (tag).** The vanilla arrow is kept and gets tags `ub:arrow` (+ `ub:armedShot`).
   - Either way, `ub:shooter` and `ub:flame` are recorded.
5. **Flight in a liquid.**
   - **A:** `liquid_inertia` 0.99 on the custom projectile.
   - **B:** in the shared interval, each tagged arrow whose block is water or lava (`includeLiquidBlocks`) has its velocity restored. The restore uses the stored air velocity, advanced by gravity and air drag for the elapsed ticks.
   - **Out of the liquid,** vanilla physics continue.
   - **In lava,** the arrow is not destroyed. It catches fire as vanilla does, which is harmless.
6. **End.** It lands on a block (a miss), lands on an entity (`L0-uwbw-phit`), or despawns or is removed (a miss). The record is dropped after a 2-tick grace, as for `remove_on_hit` (`sclk`).

**Budget.** One shared interval. Variant B touches only tagged arrows that are in flight, at most N players × 1.
