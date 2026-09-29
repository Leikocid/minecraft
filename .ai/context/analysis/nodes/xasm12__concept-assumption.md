---
type: "concept-assumption"
node_id: "L0-xasm12"
source_channel: "rollout"
analysis_version: 3
title: "ASM-L0-12 · Each component caps its own per-tick work, and the sum is accepted without a shared scheduler"
aliases: ["L0-xasm12"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-pntr", "L0-ring", "L0-lgnd", "L0-adr-ochg", "L0-pntr-ad01", "L0-pntr-ad03", "L0-ring-ad02", "L0-ring-ad04", "L0-ring-ac17", "L0-orbc-ac11"]
priority: 540
size_chars: 1603
tags: ["status:assumed", "v3-reduce", "relates_to:L0-orbc", "relates_to:L0-pntr", "relates_to:L0-ring", "relates_to:L0-lgnd"]
level: 1
---
# ASM-L0-12 · Each component caps its own per-tick work, and the sum is accepted without a shared scheduler

**Observed across the children.** Four independent bounded loops can run at once for one world:
- the `orbc` charge job, one per attack (`L0-adr-ochg` §2);
- the `pntr` removal `runJob` and its 20-tick particle job (`pntr-ad01`, `ad03`);
- the `ring` detonation queue, ≤ `RING_MAX_BLASTS_PER_TICK` (`ring-ad02`);
- the `lgnd` `protectLegendariesIn` calls, one per `pntr` attack and one per `ring` queue step (`L0-adr-oprt` §1).

Each loop exists only while it has work (C-5a′).

**Assumed (CAN_ASSUME).**
- No L0 scheduler is built.
- The system budget is taken as the sum of the per-component caps.
- The acceptance ceiling is `ring-ac17`'s "several simultaneous RMBs", read as **3 players × 1 attack each** (the shared 30 s cooldown limits each player to one), plus one concurrent LMB.
- Why this bound holds: `pntr`'s `runJob` yields to the engine by design, and the `ring` queue is the only loop that can do a burst of heavy engine work in one tick.

**If the load test fails.** The fix is to lower `RING_MAX_BLASTS_PER_TICK` or `pntr`'s cells per yield, not to add a governor. A governor would couple the two effects, and the reduce plan says they are leaves with no data between them.
