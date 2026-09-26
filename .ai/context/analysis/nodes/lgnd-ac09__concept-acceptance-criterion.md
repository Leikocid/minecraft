---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac09"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-lgnd-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 540
tags: ["acceptance-criterion", "channel:bds", "indestructibility"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003"]
---
**AC-lgnd-09: Ordinary destruction returns the instance; a pickup does not.** Channel: `bds`.

GIVEN a marked legendary item entity last held by P
WHEN it burns in lava or fire, is destroyed by cactus or an explosion, or despawns
THEN P receives it back per ac08 (Web Sword and Scythe alike),
AND an ordinary pickup of the entity by any player triggers **no** return and no generation bump,
AND an unmarked (Creative) copy is destroyed as in vanilla.
