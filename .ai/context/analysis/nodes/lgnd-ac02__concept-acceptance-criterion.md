---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac02"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 745
tags: ["v3-delta", "reconciled"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r002", "L0-lgnd-r014", "L0-lgnd-ac17"]
---
**AC-lgnd-02: Craft budgets are independent per weapon.** Channel: `bds`.

GIVEN the Web Sword flag is claimed and the Scythe and Cannon flags are unset
WHEN a Survival player crafts the Scythe
THEN the craft succeeds, and exactly one broadcast names the crafter and the Scythe,
AND the Scythe flag is set,
AND a second Survival Scythe craft (by any player, also after a restart) is refunded with 2 golden apples, 2 obsidian and 1 diamond hoe,
AND `/andrew:scythe reset` leaves the Web Sword flag set. The as-built command is per weapon; there is no `/andrew:legendary` (`ad07`).
AND the Cannon flag stays unset throughout.
