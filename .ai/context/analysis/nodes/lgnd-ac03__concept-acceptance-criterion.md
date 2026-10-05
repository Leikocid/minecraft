---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac03"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 444
tags: ["acceptance-criterion", "channel:build", "channel:bds", "cooldown"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r003"]
---
**AC-lgnd-03: Cooldowns do not bleed between weapons.** Channel: `build` (unit, stubbed clock) + `bds`.

GIVEN player P with both abilities ready
WHEN `start(P, "web_sword")` is called
THEN `isReady(P, "web_sword")` is false for 30 000 ms (± 50 ms),
AND `isReady(P, "scythe_of_calamity")` stays true throughout,
AND for another player R, both stay ready.
