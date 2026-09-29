---
type: "concept-assumption"
node_id: "L0-pntr-as03"
source_channel: "rollout"
analysis_version: 3
title: "AS-pntr-03 · Per-cell throughput is enough to look instant"
aliases: ["L0-pntr-as03"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 890
tags: ["title:AS-pntr-03 · Per-cell throughput is enough to look instant", "is_a:assumption", "CAN_ASSUME", "probe:bds", "relates_to:L0-pntr-cons", "relates_to:L0-pntr-ad01"]
level: 2
---
# AS-pntr-03 · Per-cell throughput is enough to look instant

**Gap.** There are no measured numbers for `getBlock` + `setType` cost on BDS 1.26.x with `runJob`.

**Assumption (CAN_ASSUME).**
- `runJob` processes at least ~2,000 column cells per tick without pushing the tick above 50 ms on the target host.
- So a typical Overworld column (~3,500 cells) finishes in ≤ 3 ticks, and the worst case (~9,600 cells) in ≤ 6 ticks (PN-1).

**Probe.** A gametest fires LMB from y=319 in a stone-filled test area and records `report.ticksUsed` and the tick times. It is repeated with 3 concurrent columns.

**Impact if wrong.**
- Removal visibly lags (the shaft "unzips" downward). Mitigations, in order:
  1. the hybrid `fillBlocks` fast path (`L0-pntr-ad01`, rejected alternative 1);
  2. relaxing PN-1 to ≤ 10 ticks and documenting it (C-15 rank 4 < rank 3).
- AC-10 (`L0-pntr-ac07`) is at risk.
