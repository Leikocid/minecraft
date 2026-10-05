---
type: "concept-process"
node_id: "L0-sclk-p003"
source_channel: "rollout"
analysis_version: 7
title: "P-sclk-003 · Flight, trail and expiry (shared interval)"
aliases: ["L0-sclk-p003"]
is_a: ["process"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1460
tags: ["process", "trail", "lifetime", "C-5f", "particles"]
level: 2
---
# P-sclk-003 · Flight, trail and expiry (shared interval)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["process"]` · `relates_to: ["L0-sclk-r007", "L0-sclk-ent3", "L0-sclk-ad02", "L0-sclk-ad03", "L0-xasm27"]`

**Driver.** The add-on's shared `runInterval` (1 tick). This is not a new interval and not `runJob`, because starting a job stalls the next tick by 15–30 ms. If the bolt map is empty, the handler returns at once, so the idle cost is zero (C-5f).

**Each tick, for each `BoltRecord`:**
1. If the bolt entity is not valid, drop the record. A hit handler, an unload or a reload has already settled it.
2. **Expiry.** Remove the bolt with **no outcome** and drop the record when any of these holds:
   - `now − bornTick ≥ BOLT_LIFETIME_TICKS` (100, `xasm27`);
   - the bolt's chunk is not loaded;
   - `y < dimension.heightRange.min`.

   Log `sculk: bolt <id> expired <reason>`.
3. **Trail.** Spawn `TRAIL_PER_TICK` (≤ 3) particles evenly spaced on the segment `lastPos → location`. The particle is `minecraft:sonic_explosion`, or the RP look-alike `andrew:sonic_trail` (`ad02`). Then set `lastPos = location`. The trail follows the bolt's **real** position, so it bends with gravity (§4).
4. The trail spawns no entity, deals no damage, applies no knockback and edits no block (§4, T05).

**Reload.** After a server restart or a chunk reload, a bolt that comes back through `entityLoad` has no record (C-23). It is removed on sight and has no outcome.
