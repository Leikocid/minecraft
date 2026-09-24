---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac07"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 540
tags: ["acceptance-criterion", "channel:bds", "death-retention"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r008"]
---
**AC-lgnd-07: Death with several legendaries returns each exactly once.** Channel: `bds`.

GIVEN P carries a marked Web Sword in the off hand, a marked Scythe in the hotbar, and an admin Web Sword in the inventory
WHEN P dies (also in the Void), respawns, disconnects and reconnects, and the server restarts
THEN P holds exactly those three instances (same ids),
AND no item entity of any of them is left at the death spot,
AND no fourth copy exists.
