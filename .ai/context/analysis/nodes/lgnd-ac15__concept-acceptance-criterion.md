---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac15"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-ac15"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 1041
tags: ["v3-delta", "orbital-AC-2"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r014", "L0-lgnd-ad08", "L0-xcx9", "L0-lgnd-as13"]
---
**AC-lgnd-15: `/give` and Creative copies never touch the craft flag (Orbital AC-2, all three weapons).** Channel: `bds` + `ipad` (crafting preview).

GIVEN a fresh world with every flag unset and Survival player S
WHEN the console runs `/give S andrew:orbital_cannon`, `/give S andrew:web_sword` and `/give S andrew:scythe_of_calamity`,
AND Creative player C takes a Cannon from the Creative inventory and drops it to S
THEN S holds four **unmarked** stacks, and no flag is set, no broadcast is sent and nothing is refunded,
AND S's first Survival Cannon craft afterwards claims the flag, sends exactly one broadcast and yields a stack marked `origin: craft` with `holder` = S,
AND a Cannon crafted by C in Creative is unmarked, and the flag stays as it was.

On the iPad, the crafting-table preview shows the Orbital Cannon icon and name. The token id is never visible in the inventory after the next tick.
