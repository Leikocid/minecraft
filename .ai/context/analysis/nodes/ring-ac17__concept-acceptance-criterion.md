---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac17"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-ac17"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 539
tags: ["is_a:acceptance-criterion", "verify:bds", "performance", "C-20", "relates_to:L0-ring-cons", "relates_to:L0-ring-ad02", "relates_to:L0-ring-as05"]
level: 2
---
**AC-ring-17 · Three simultaneous RMBs stay within budget** (Orbital §12, §15; C-5a′; RG-1 to RG-3) · **verify: bds**

GIVEN 3 SimulatedPlayers with their own Cannons over three adjacent flat pads (their footprints overlap by 5 blocks). WHEN all three fire RMB in the same tick, THEN:
- `maxBlastsInTick` ≤ 48;
- all queued blasts drain within 13 ticks;
- server tick time stays above 50 ms for at most 3 consecutive ticks and never exceeds 150 ms;
- after 60 ticks the ring queue interval is cleared and orbc's flight interval is cleared.
