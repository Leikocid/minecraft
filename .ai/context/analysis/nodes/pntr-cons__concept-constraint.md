---
type: "concept-constraint"
node_id: "L0-pntr-cons"
source_channel: "rollout"
analysis_version: 3
title: "Penetrator NFRs (refining C-5a′, C-14, C-15, C-16 and C-19)"
aliases: ["L0-pntr-cons"]
is_a: ["constraint"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1493
tags: ["title:Penetrator NFRs", "is_a:constraints", "constraint:C-5a′", "constraint:C-14", "constraint:C-15", "constraint:C-16", "constraint:C-19", "relates_to:L0-pntr-as03"]
level: 2
---
# Penetrator NFRs (refining C-5a′, C-14, C-15, C-16 and C-19)

| ID | NFR | Measured by |
|---|---|---|
| PN-1 | **Looks instant.** The top 16 layers are removed in the detonation tick. The whole column is removed within **≤ 3 ticks** for a typical Overworld column (~140 layers) and **≤ 6 ticks** for the worst case (y 319 → −64, ~9,600 cells) on BDS 1.26.x. | `report.ticksUsed` in a gametest |
| PN-2 | **Budget.** No `pntr` job step exceeds its `runJob` slice. The server tick time must not rise above 50 ms because of one LMB, and with **3 concurrent LMBs** it must not stay above 50 ms for more than 2 consecutive ticks. | A BDS tick-time probe, next to the `ring` load probe |
| PN-3 | **Bounded.** 2 jobs per attack, both self-terminating, and 0 entities spawned. The wave is ≤ 16 `spawnParticle` calls per tick for 20 ticks. | Code review plus a gametest entity count |
| PN-4 | **No force-load.** Unloaded cells are skipped (C-14). | A gametest at a chunk edge |
| PN-5 | **Safety first.** A protection failure keeps the container (C-15 rank 1 beats rank 4). | A unit test with a mocked `lgnd` that throws |
| PN-6 | **Documented deviations** (C-16), next to the code: the keep list is a list, not a hardness query; item frames (`cx01`); nested storage items (`as05`); waterlogged handling (`as04`). | Code review |

If PN-1 and PN-2 cannot both hold, PN-2 wins (C-15 rank 3 over rank 4). The fallback is to relax PN-1 to "≤ 10 ticks", documented as a deviation (see `L0-pntr-as03`).
