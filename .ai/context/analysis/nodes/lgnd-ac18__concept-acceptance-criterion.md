---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac18"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-ac18"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 847
tags: ["v3-delta", "last-holder"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad11", "L0-lgnd-ent2", "L0-adr-hold", "L0-xcx11"]
---
**AC-lgnd-18: A transferred legendary returns to the last holder, not to the crafter.** Channel: `bds`.

GIVEN A crafted the Scythe and hands it to B (drop and pickup, or through a chest)
THEN the stack's `holder` is B, and `owner` is still A.

WHEN B drops it into the Void or lava
THEN B receives it (`gen + 1`), and A receives nothing and no message.

WHEN B is offline at that moment
THEN `andrew:sc_owed[B]` holds it, and B gets it on the next join.

GIVEN the Scythe sits in a chest that A placed it in, and A dies
THEN nothing happens to it.

WHEN it passes through a hopper into another chest
THEN `holder` stays A: a container never becomes the holder.

Pending the client's confirmation of `L0-adr-hold`.
