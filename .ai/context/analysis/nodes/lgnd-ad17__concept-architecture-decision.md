---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad17"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-17: v7 ships the crossbow against `mark.owner`; the holder field is a separate task, and tests read the target through one helper"
aliases: ["L0-lgnd-ad17"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1702
tags: ["v7", "holder", "xcx11"]
level: 2
---
# AD-lgnd-17: v7 ships the crossbow against `mark.owner`; the holder field is a separate task, and tests read the target through one helper

Related: L0-xcx11, L0-adr-hold, L0-lgnd-ad11, L0-lgnd-cx16, L0-lgnd-ac24, L0-lgnd-ac27.

**Context.** `decision-resolve-l0-xcx11` chose the last holder. The code returns to `mark.owner` (`recovery.ts:490`, `:877-879`). The scope asks to either plan the holder or restate T20/Void against the owner, as v6 did for the Katana.

**Decision.**
1. **Both, in order.** The crossbow's framework ACs (`ac27`) state the return target as `mark.owner` **today**, exactly as the Katana's `ac24` does. The holder is planned as `LGND-HOLD` (design `ad11`, AC `ac18`), not bundled into def #5.
2. **One seam.** The legendary GameTests get a `returnTarget(mark)` helper that returns `mark.owner` now. `LGND-HOLD` changes it to `holder ?? owner` together with `recovery.ts`, so the T18/T20 assertions of all five weapons switch in one edit and in the same commit as the fix.
3. **Crossbow-specific check before the holder ships:** A crafts, hands the crossbow to B, B drops it into the Void → A receives it. That is the known deviation, documented in the README as "returns to its crafter (last-holder return pending)". It is not a passing test of the spec clause.

**Rejected.**
- (a) **Bundle the holder into def #5.** It changes return behaviour for four shipped weapons under a crossbow task, and widens the crossbow's blast radius to every recovery GameTest.
- (b) **Wait for the holder before the crossbow.** Nothing in the crossbow depends on it; the delay buys nothing.
- (c) **Restate the spec as "the crafter".** The decision chose the holder; this would overrule it.
