---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac02"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 677
tags: ["acceptance-criterion", "channel:bds", "craft-gate"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r002"]
---
**AC-lgnd-02: Craft budgets are independent per weapon.** Channel: `bds`.

GIVEN the Web Sword flag is claimed and the Scythe flag is unset
WHEN a Survival player crafts the Scythe
THEN the craft succeeds, exactly one broadcast naming the crafter and the Scythe is sent, and the Scythe flag is set,
AND a second Survival Scythe craft (by any player, also after restart) is refunded with 2 golden apples, 2 obsidian and 1 diamond hoe,
AND `/andrew:legendary reset scythe_of_calamity` leaves the Web Sword flag set,
AND a Creative-mode Scythe craft neither claims the flag nor is refunded.
