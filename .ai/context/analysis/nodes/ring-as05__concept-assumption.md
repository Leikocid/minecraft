---
type: "concept-assumption"
node_id: "L0-ring-as05"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as05"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 802
tags: ["is_a:assumption", "CAN_ASSUME", "performance", "probe:bds", "relates_to:L0-ring-ad02", "relates_to:L0-ring-cons"]
level: 2
---
**ASM-ring-05 · 48 power-4 explosions per tick fit the tick budget on BDS in Docker on the M4 Pro**

**Assumption.** `RING_MAX_BLASTS_PER_TICK = 48` with `doTileDrops` false keeps tick time within RG-3, with the players on iPad.
- The value is a starting guess: vanilla handles TNT cannons of this order.
- The cost is dominated by explosion ray-casting (~1,300 rays per blast) and client chunk re-sends.

**Probe.** 3 SimulatedPlayers fire RMB at the same tick over flat stone. Log `system.currentTick` deltas and the wall-clock ms per tick.

**Impact if wrong.**
- Lower the cap: 32, then 16. With 3 attacks, the drain time grows to ≤ 30 ticks (1.5 s), and RG-2 is relaxed as allowed.
- If even 16 fails, the only remaining lever is fewer charges: a 4-connected ring, about −30% (`L0-xasm8` impact).
