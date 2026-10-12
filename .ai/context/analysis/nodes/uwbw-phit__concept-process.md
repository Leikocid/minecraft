---
type: "concept-process"
node_id: "L0-uwbw-phit"
source_channel: "rollout"
analysis_version: 10
title: "P-uwbw-hit · Resolving a hit: normal or armed"
aliases: ["L0-uwbw-phit"]
is_a: ["process"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1920
tags: ["v10", "underwater-bow", "hit", "process"]
level: 2
---
# P-uwbw-hit · Resolving a hit: normal or armed

**Links.** relates_to: L0-uwbw-r001, L0-uwbw-r002, L0-uwbw-r003, L0-uwbw-adex, L0-strm, L0-uwbw-esfr.

**Trigger.** A hurt before-event whose damaging projectile is a bow arrow (`ub:arrow` or `andrew:underwater_arrow`). The cause is `projectile`.

**Before-event (synchronous).**
1. Read `event.damage`, the target type, and `isLiving` (it has `minecraft:health` and is not an armour stand, boat, minecart or frame; `L0-uwbw-r001`).
2. **Normal arrow.** Leave the damage alone: vanilla damage, including Power and crit.
3. **Armed arrow (`ub:armedShot`) on a living target with `event.damage > 0`.** Rewrite the damage to the post-armour value of exactly 14 (`L0-uwbw-r003`, `adex`).
   - If that would be lethal, set the hit to 0 and schedule an `applyDamage` follow-through with no projectile cause. This keeps the totem path.
   - Record `hitKey = arrowId:targetId` as **qualified**.
4. A cancelled event or a swallowed hit (hurt window, shield) is never qualified.

**After-event / projectile-hit (same tick).**
- **Normal hit:** `setOnFire(max(2, flameSeconds))` (`L0-uwbw-r002`). The target is not re-ignited if it is in water; vanilla puts it out.
- **Qualified armed hit, in one synchronous block (C-26):**
  1. `playStrikes(dimension, target foot, flash, [0])` once per `hitKey` (C-30′, no `lightning_bolt`);
  2. start Super Fire for 100 ticks (`L0-uwbw-esfr`);
  3. `startCooldown(player, "ub")` for 600 ticks;
  4. clear `ub:armed` and the pending shot.

  The fire from a normal hit is **not** also applied: Super Fire supersedes it.
- **Unqualified armed arrow** (block, shield, non-living, despawn, the shooter itself): clear the pending shot only. `ub:armed` stays, and there is no cooldown and no HUD change (C-41).

**Witness.** Each step logs a `[andrew] ub` line with the hit key, the damage read and written, and the plan. GameTests read these lines.
