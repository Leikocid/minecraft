---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac10"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 550
tags: ["acceptance-criterion", "channel:bds", "anti-dup"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r005"]
---
**AC-lgnd-10: A stale-generation copy is voided.** Channel: `bds`.

GIVEN an instance whose generation was bumped by a return while the original stack survived (for example collected by a hopper into a chest)
WHEN any player moves the stale stack into their inventory
THEN it is deleted in the handling of that event and the player gets a `voided` message,
AND during that window it could neither cast nor be retained on death,
AND the live copy is unaffected.
