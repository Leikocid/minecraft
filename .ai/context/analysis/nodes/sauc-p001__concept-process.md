---
type: "concept-process"
node_id: "L0-sauc-p001"
source_channel: "rollout"
analysis_version: 5
title: "P-sauc-1 · Saucer flight: spawn, arrival, hover, departure, removal"
aliases: ["L0-sauc-p001"]
is_a: ["process"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 2220
tags: ["is_a:process", "flight-path", "relates_to:L0-sauc-r002", "relates_to:L0-sauc-ad02", "relates_to:L0-ufoc"]
level: 2
---
# P-sauc-1 · Saucer flight: spawn, arrival, hover, departure, removal

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["process"]` · `relates_to: ["L0-sauc-r002", "L0-sauc-r005", "L0-sauc-ad02", "L0-ufoc", "L0-magn"]`

**Trigger:** `ufoc.onPhase("arrival", {centre, hoverY, eventId})`.

1. **Spawn.**
   - Draw a random bearing θ.
   - `start = (centre.x + 90·cosθ, hoverY + 10, centre.z + 90·sinθ)`.
   - `dimension.spawnEntity("andrew:ufo_saucer", start)` in the Overworld. Add the tag `andrew:ufo` and the dynamic property `andrew:ufo_event = eventId`.
   - Register the interceptor (`p003`).
   - If the spawn throws because the chunk is not loaded, retry at the next tick and log it. The probe found that an entity near the target is ticked (U8). If it still fails after 20 ticks, `ufoc` ends the event as a departure (`as04`).
2. **Arrival (400 ticks).**
   - Each tick `t`: `pos = lerp(start, hoverPoint, ease(t/400))`, with `hoverPoint = (centre.x + 0.5, hoverY, centre.z + 0.5)` and ease = smoothstep.
   - Call `saucer.teleport(pos)`. The yaw comes from the spin animation on the client, not from the script.
3. **Hover / magnet (1200 ticks).**
   - The position is held at `hoverPoint`, re-teleported only if it drifts by more than 0.01.
   - The beam property is on (`r005`), and the magnet-on sound and the hum every 40 ticks play (`r006`).
4. **Release.** The beam goes off and the magnet-off sound plays. This is the same tick as `magn` releases.
5. **Departure (300 ticks).**
   - `end = (centre.x + 90·cos(θ+π), hoverY + 10, centre.z + 90·sin(θ+π))`.
   - `pos = lerp(hoverPoint, end, easeIn(t/300))`.
6. **Removal.** At t = 300: unregister the interceptor, call `saucer.remove()`, and report "gone" to `ufoc`, which starts the 15 min pause.

**Invariants on every tick:**
- The horizontal distance from the centre is ≤ 90, and therefore ≤ 100 (C-12′).
- The saucer is either valid or the event is over.
- If `saucer.isValid` is false while a phase is running (for example `/kill` or an unload), the event is treated as a departure. `ufoc` removes it and schedules the next arrival at +15 min. No second saucer is spawned (UFO AC-3).

**Shoot-down** at any step preempts the flight and hands over to `p002`.
