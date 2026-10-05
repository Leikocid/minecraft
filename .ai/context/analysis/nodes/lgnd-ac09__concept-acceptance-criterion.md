---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac09"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 757
tags: ["v3-delta", "reconciled"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r012", "L0-lgnd-as11"]
---
**AC-lgnd-09: Vanilla item-entity destruction returns the instance; a pickup does not.** Channel: `bds`.

GIVEN a marked legendary item entity (any of the three) last held by P
WHEN it is destroyed by cactus or a **vanilla** TNT explosion, or despawns (in lava or fire it stays where it lies, same gen, nothing owed)
THEN P receives it back per `ac08`,
AND an ordinary pickup of the entity by any player triggers **no** return and no gen bump, and that player becomes `holder`,
AND an unmarked (Creative or vanilla `/give`) copy is destroyed as in vanilla (`as11`).

Destruction by the Orbital Cannon is not covered here, because the item must not be destroyed at all (`ac19`).
