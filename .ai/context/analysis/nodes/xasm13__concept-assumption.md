---
type: "concept-assumption"
node_id: "L0-xasm13"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "ASM-L0-13 · UFO timing is tested on an injectable clock; restart ACs are bds-check restart scenarios"
aliases: ["L0-xasm13"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1052
tags: ["CAN_ASSUME", "status:assumed", "relates_to:L0-xcx17", "relates_to:L0-ufoc", "v4"]
---
---
title: "ASM-L0-13 · UFO timing is tested on an injectable clock; restart ACs are bds-check restart scenarios"
aliases: ["L0-xasm13"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-xcx17", "L0-ufoc", "L0-sauc"]
see_also: ["ufomagnetspecv1ruen-part-4"]
---
# ASM-L0-13 · UFO timing is tested on an injectable clock; restart ACs are bds-check restart scenarios

**Assumption.**
- `ufoc` takes `now()` and a phase-duration table from a module seam. The product binds `Date.now` and the spec durations.
- GameTest scenarios bind a scaled clock. They assert:
  - the arrival window [10, 20] min;
  - "+15 min after departure";
  - "waits for an Overworld player".

  They do this in seconds of wall time.
- One scenario runs the real 20/60/15 s phases (AC-2).
- AC-1 (restart half), AC-17 and AC-18 run as restart scenarios on the checks instance.

**Impact if wrong.** If the operator insists on literal GameTest for restart ACs, they become manual `ipad`/operator checks. The DoD line "all BDS ACs automated" then has to be amended in the spec.
