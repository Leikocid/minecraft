---
type: "concept-assumption"
node_id: "L0-katn-as01"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-as01"]
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1074
tags: ["assumption", "CAN_ASSUME", "katana", "is_a:assumption", "relates_to:L0-xasm18", "relates_to:L0-xasm19"]
level: 2
---
---
title: "AS-katn-01 · The head lands where the player looked; the feet cell is derived from it"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-xasm18", "L0-xasm19", "L0-katn-p001", "L0-katn-r004"]
---
**Gap.** `L0-xasm19` starts the search at "the endpoint cell" as the feet cell. `L0-xasm18` says the result is never further than 20 from the head.
- Taking an eye-level endpoint 20 blocks out as the **feet** cell raises the player by about 1.6 blocks.
- That puts the head about 20.06+ from the start, which breaks the cap.
- It also makes the player float a step above where they aimed.

**Assumption (CAN_ASSUME).**
- Floor hit (Up face): the feet cell is the cell above the hit block.
- Any other case: the desired feet = endpoint − (0, 1.62, 0), so the head arrives at the aimed point.
- Every candidate must satisfy |head after − head before| ≤ 20.

**Impact if wrong.** If the client expects the feet at the aimed point, change one line in `plan.ts`. T06's bound then shifts by the eye height, and the T05 and T07 tests are unchanged. Local to `katn`.
