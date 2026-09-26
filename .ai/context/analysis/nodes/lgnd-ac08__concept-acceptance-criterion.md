---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac08"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-lgnd-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 542
tags: ["acceptance-criterion", "channel:bds", "void-return"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r011"]
---
**AC-lgnd-08: Void return to the last holder, exactly once.** Channel: `bds`.

GIVEN P last held a marked Scythe (gen g) and drops it into the Void
WHEN the item entity falls below the dimension's minimum height
THEN P receives it with the same id and gen g + 1, plus a private "returned" message,
AND the Scythe craft flag is unchanged.

If P is offline, the owed entry survives a restart and is redeemed exactly once on P's next join.
