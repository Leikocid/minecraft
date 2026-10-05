---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac07"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 772
tags: ["v3-delta", "reconciled"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r008", "L0-lgnd-cx10", "L0-adr-wpn2"]
---
**AC-lgnd-07: Death returns one marked copy of each weapon, including the off-hand one, exactly once.** Channel: `bds` + `ipad` (off hand).

This is narrowed by the `wpn2` ruling on `cx10` (b).

GIVEN P carries a marked Web Sword in the **off hand**, a marked Scythe in the hotbar and a marked Orbital Cannon in the inventory
WHEN P dies (also in the Void), respawns, disconnects and reconnects, and the server restarts
THEN P holds exactly those three instances (same ids, same `gen`),
AND no item entity of any of them is left at the death spot,
AND no fourth copy exists.

A second marked copy of the same weapon is outside this AC (a known limit).
