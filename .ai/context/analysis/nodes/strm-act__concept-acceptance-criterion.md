---
type: "concept-acceptance-criterion"
node_id: "L0-strm-act"
source_channel: "rollout"
analysis_version: 8
title: "AC strm-act (bds)"
aliases: ["L0-strm-act"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1566
tags: ["v8", "storm-blade", "channel:bds", "trace", "cooldown", "C-20"]
level: 2
---
---
title: "AC strm-act · Range, wall stop, first target only, cooldown (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rcd", "L0-strm-pact", "L0-strm-adtr"]
---
# AC strm-act (bds)

1. **Range.**
   - A target at 9.5 blocks Euclidean is hit.
   - A target at 10.5 is not hit, and the cooldown is still spent.
   - The same holds on a diagonal (x = z): one target at 9.5 is hit, another at 10.5 is not. This guards the cell-step trap.
2. **Wall stop.** A 1-block solid wall at 5 blocks with a target at 7 behind it: the target is untouched, the trace ends at the wall face, and the cooldown is spent.
3. **Non-stopping blocks.** Tall grass and carpet between the wielder and the target at 6 do not stop the hit.
4. **First target only** (C-20⁗). Two mobs in a line at 4 and 6: only the first loses health. That holds even when the first dies from the hit.
5. **Cooldown.**
   - After a valid release, a second Use at +1 s deals nothing and the cooldown remaining is unchanged (invalid attempts are free).
   - At ≥ 600 ticks a Use fires again.
   - A miss into air spends the cooldown.
6. **Hand priority.** Main hand on cooldown + a second blade-free legendary or a blade in the off hand: the off hand activates per `resolveActivation` (the `lgnd` hand scenarios with def #6).
7. **HUD.** The action-bar text equals the lang "Ready" string when ready and the ceil seconds while cooling down (read through the HUD formatter in a unit test).
8. **Katana unchanged.** The Katana unit and BDS scenarios pass after the `plan.ts` export.
