---
type: "concept-constraint"
node_id: "L0-ring-cons"
source_channel: "rollout"
analysis_version: 3
title: "Ring NFRs (refining C-5a′, C-12, C-15, C-16 and C-19)"
aliases: ["L0-ring-cons"]
is_a: ["constraint"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1725
tags: ["is_a:constraints", "performance", "relates_to:L0-pntr-cons", "relates_to:L0-ring-p003", "relates_to:L0-ring-ac17"]
level: 2
---
# Ring NFRs (refining C-5a′, C-12, C-15, C-16 and C-19)

| ID | NFR | Measured by |
|---|---|---|
| RG-1 | **Bounded work.** ≤ `RING_MAX_BLASTS_PER_TICK` (48) `createExplosion` calls per tick across all attacks. One `protectLegendariesIn` call per dimension per queue step. 0 entities spawned by `ring`. | Code review plus the gametest report `maxBlastsInTick` |
| RG-2 | **Latency.** The first blast happens in its contact tick. The queue drains in ≤ 4 ticks for 1 attack and ≤ 10 ticks for 3 concurrent attacks on flat ground. | The report's `ticksToDrain` in a 3-player gametest |
| RG-3 | **Tick budget.** With 3 concurrent RMBs over flat stone on BDS 1.26.x, tick time stays above 50 ms for no more than 3 consecutive ticks, and never above 150 ms. If this fails, lower the cap (`as05`) before touching anything else. | BDS tick-time probe, shared with PN-2 |
| RG-4 | **Entity hygiene.** The `minecraft:item` count within footprint ± 8 after the attack is at most the count before, plus the vanilla drops of mobs and players killed (C-19). There are no orphan charges. | Gametest entity diff |
| RG-5 | **Rank-1 safety.** `doTileDrops` is restored in `finally` in the same call. A thrown error in any blast or in protection never leaves the rule toggled, and never deletes a legendary. | A unit test with a throwing `createExplosion` mock and a throwing `lgnd` mock |
| RG-6 | **Documented deviations** (C-16), next to the code: the queue delay (`ad02`), the gamerule toggle (`ad01`), item frames and nested storage (`r008`), and the container fallback if it is enabled (`as02`). | Code review |

If RG-2 and RG-3 conflict, RG-3 wins (C-15 rank 3 over rank 4). Relax RG-2 to "≤ 20 ticks for 3 attacks" and document it.
