---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac01"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 984
tags: ["v3-delta", "reconciled"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r006", "L0-lgnd-cx07", "L0-adr-wpn2", "L0-lgnd-ad08"]
---
**AC-lgnd-01: An upgrade keeps the craft flags, the pending token and the marks.** Channel: `bds`.

The cooldown clause was dropped by the `wpn2` ruling on `cx07`.

GIVEN a world saved by the pre-v3 build where:
- the Web Sword and the Scythe were Survival-crafted;
- player Q has a single-object `ws_pending`;
- a marked sword and a marked Scythe carry no `_gen` and no `_holder`

WHEN the server restarts on the v3 build
THEN crafting either weapon in Survival (a token arrives) is refunded with its `craft_blocked` message and no broadcast,
AND Q receives exactly one sword on the next spawn,
AND both pre-v3 stacks cast, are retained on death and return to their `owner` after a Void loss (no holder recorded yet),
AND once the pre-v3 sword enters a player's inventory, it carries `_holder` = that player,
AND the Orbital Cannon flag is unset.
