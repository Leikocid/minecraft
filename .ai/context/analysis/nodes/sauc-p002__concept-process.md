---
type: "concept-process"
node_id: "L0-sauc-p002"
source_channel: "rollout"
analysis_version: 5
title: "P-sauc-2 · Shoot-down: absorb → magnet off → smoking fall → harmless blast → reward → broadcast"
aliases: ["L0-sauc-p002"]
is_a: ["process"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 2617
tags: ["is_a:process", "shoot-down", "relates_to:L0-sauc-r001", "relates_to:L0-sauc-r004", "relates_to:L0-adr-ufoi", "relates_to:L0-ufoc", "relates_to:L0-magn"]
level: 2
---
# P-sauc-2 · Shoot-down: absorb → magnet off → smoking fall → harmless blast → reward → broadcast

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["process"]` · `relates_to: ["L0-sauc-r001", "L0-sauc-r004", "L0-sauc-p003", "L0-adr-ufoi", "L0-ufoc", "L0-magn"]`

**Trigger.** The saucer's interceptor returns `true` for a charge segment, as defined by `r001`, in any phase: arrival, magnet or departure.

1. **Absorb.** The flight loop ends that charge with the outcome `"intercepted"`. The entity is removed and no effect runs (`p003`). Charges that cross the hull later, including during the fall, are also absorbed, but they do not restart this process (`as05`).
2. **Latch.**
   - If `state.downed` is already set, stop here.
   - Otherwise set `downed = true` and store `shooterId = attack.ownerId`.
   - Resolve `shooterName` now from the online players. If the shooter is offline, use the fallback in `as03`.
3. **Magnet off.**
   - Call `ufoc.requestMagnetOff("shot")`. `ufoc` runs the normal release, so `magn` drops everything with vanilla physics (UFO §8).
   - Set the beam property off and play the magnet-off sound, but only if the magnet was on.
   - In arrival and departure the call is a no-op for `magn`.
4. **Report.** Call `ufoc.reportShotDown({eventId, ownerId, ownerName})`. `ufoc` leaves the phase machine and enters `downed`, and the next arrival is set to now + 15 min (UFO §2, §8).
5. **Fall (≤ 60 ticks).**
   - Each tick: `vy += a` (`as02`), then `y -= vy`, then teleport.
   - Emit a smoke particle trail (`minecraft:large_smoke` or `campfire_tall_smoke_particle`, ≤ 4 calls per tick) at the hull.
   - The saucer touches the ground when the column under the hull's centre has a non-air cell (solid or liquid) at or above the new bottom Y. Liquids count, so the blast happens at the surface.
6. **Blast.** This happens on contact or at tick 60, whichever is first, at point P:
   - `spawnParticle("minecraft:huge_explosion_emitter", P)`;
   - `playSound("random.explode", P, {volume: 4})`;
   - **no** `createExplosion` (`r004`, `ad03`).
7. **Reward.** `spawnItem(diamond × 8)` and `spawnItem(totem_of_undying × 1)` at P, exactly once per `eventId`.
8. **Broadcast.** `world.sendMessage({translate: "andrew.ufo.shot_down", with: [shooterName]})` to every player.
9. **Cleanup.** Unregister the interceptor and call `saucer.remove()`.

**Failure handling.**
- If the saucer becomes invalid mid-fall, the blast, reward and broadcast still run at the last known position. They are tied to the latch, not to the entity.
- Each step is wrapped so that a throw cannot leave `ufoc` stuck in `downed`.
