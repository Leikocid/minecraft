---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac07"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 602
tags: ["title:AC-10 (bds) · Removal looks instant within budget", "is_a:acceptance-criterion", "channel:bds", "orbital-ac:10", "constraint:C-5a′", "relates_to:L0-pntr-cons", "relates_to:L0-pntr-as03"]
level: 2
---
**GIVEN** a stone-filled area on the QA BDS (port 19134).
**WHEN**:
- (a) one LMB detonates at y=76;
- (b) one LMB detonates at y=319;
- (c) three players fire LMB in the same tick at y=76.

**THEN** the removal job reports:
- the top 16 layers removed in the detonation tick;
- `ticksUsed ≤ 3` for (a), `≤ 6` for (b), and `≤ 6` for each column in (c);
- no server tick above 50 ms in (a), and at most 2 consecutive ticks above 50 ms in (b) and (c).

If this fails, the result is recorded against `L0-pntr-as03`, and the deviation path in `L0-pntr-cons` is taken. The criterion is not silently widened.
