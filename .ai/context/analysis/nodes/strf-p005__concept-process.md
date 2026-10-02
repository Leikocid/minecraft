---
type: "concept-process"
node_id: "L0-strf-p005"
source_channel: "rollout"
analysis_version: 5
title: "Process — the tick budget and job scheduling (closes `L0-xcx4`)"
aliases: ["L0-strf-p005"]
is_a: ["process"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1915
tags: ["is_a:process", "performance", "tick-budget", "resolves:L0-xcx4", "relates_to:L0-xcx4"]
level: 2
---
# Process — the tick budget and job scheduling (closes `L0-xcx4`)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["process"]` · closes `L0-xcx4` (C-5b)

**Loops `strf` owns**
1. `discover`: `runInterval` every 20 ticks. It does O(players × (2R+1)²) map lookups and **no block reads**. Target cost < 0.5 ms.
2. `worker`: **one** `system.runJob(generator)`. It starts when the queue is non-empty and ends when the queue drains, so it is not permanent. It processes the queue:
   - it yields after every `PROBE_BATCH = 64` block reads;
   - it yields after each `structureManager.place`;
   - it yields after each chest fill and each guard spawn;
   - it has a soft cap of **one** placement per tick.

Nothing else runs per tick. Persistent guards need no tick logic, and neither do spawners.

**Why this satisfies §7 and C-5b**
- There is no scan of all loaded chunks. The only world reads are footprint probes of rolled-positive candidates: about 1–5 % of newly seen chunks.
- The work is event-like: a new chunk becomes visible, then it is evaluated once.
- Weapon-side C-5a is unaffected.

**Back-pressure.** If the queue holds more than 2048 chunks (a teleport spree), drop the oldest *unrolled* entries without marking them evaluated. They are re-enqueued when a player comes near them again.

**Measurement (BDS probe `L0-strf-p006`, item 7).** Log `ms per place` for each template and `ms per validation`. Acceptance: no single tick exceeds 50 ms (hard) in the Windmill place case. If `place` of the 35×35×30 Windmill alone exceeds that, split the template into 2–4 vertical slices placed on consecutive ticks. That split is recorded in the deviation report.

**Resolution text for `L0-xcx4`.** The permanent loop is the 20-tick discovery map lookup with zero block I/O. All block I/O is in a queue-driven job that terminates. This is consistent with both the spirit of C-5a (no permanent world scanning) and §7.
