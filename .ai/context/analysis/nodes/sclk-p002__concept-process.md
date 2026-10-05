---
type: "concept-process"
node_id: "L0-sclk-p002"
source_channel: "rollout"
analysis_version: 7
title: "P-sclk-002 · Shot → bolt substitution"
aliases: ["L0-sclk-p002"]
is_a: ["process"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1948
tags: ["process", "pipeline", "bolt", "multishot", "C-26"]
level: 2
---
# P-sclk-002 · Shot → bolt substitution

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["process"]` · `relates_to: ["L0-adr-scdm", "L0-sclk-r001", "L0-sclk-r006", "L0-sclk-ent2", "L0-sclk-ent3", "L0-sclk-as05"]`

**Trigger.** An arrow-type projectile spawns (`minecraft:arrow`, including tipped and spectral variants). Its `owner` is a Player whose **main hand** holds `andrew:sculk_crossbow`. The base item is a shooter, and shooters do not fire from the off hand.

**Steps (all in the spawn tick):**
1. Read `owner`, `location` and `getVelocity()` from the arrow. If any is missing, leave the arrow alone, log `sculk: spawn without owner/velocity`, and stop (C-16; the probe Q4 decides whether this path is reachable).
2. Gate on charge (`L0-sclk-r006`, `cx02`). If the arrow's speed is below `MIN_BOLT_SPEED`, it is removed and **no** bolt is spawned. The arrow item is not refunded.
3. `arrow.remove()`. The arrow never ticks, so it deals no vanilla damage and cannot be picked up.
4. `dimension.spawnEntity("andrew:sculk_bolt", location)`. Then `projectile.owner = owner` and `projectile.shoot(velocity)`; the speed and direction are unchanged.
5. Create a `BoltRecord` (`L0-sclk-ent3`) keyed by the bolt's entity id, with a fresh `seed`, `bornTick` and `lastPos`.
6. **Multishot.**
   - If native (probe Q3), three arrows spawn and each goes through steps 1–5, one record each.
   - If emulated (`as05`), the substitution of the centre arrow also spawns two extra bolts, with velocity rotated by ±10° yaw. Each gets its own record. Only one arrow is consumed, as in vanilla.
7. Log `sculk: bolt <id> owner <name> v <speed>`.

**Never.**
- Two bolts from one arrow.
- A bolt from an arrow whose owner is not holding the crossbow: a dispenser, a skeleton, or a player with a vanilla bow.
- A firework rocket path (`xasm27`): a custom shooter has no rocket ammunition. If option B is adopted, a loaded rocket becomes one bolt and does not explode.
