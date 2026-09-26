---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac01"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-lgnd-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 696
tags: ["acceptance-criterion", "channel:bds", "migration"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r006"]
---
**AC-lgnd-01: Upgrade from 0.3.0 keeps the flag, the cooldown, the pending token and the marks.** Channel: `bds`.

GIVEN a world saved by 0.3.0 where:
- the Web Sword was Survival-crafted;
- player P has `andrew:ws_cooldown_until` = now + 20 s;
- player Q has a single-object `ws_pending`;
- a marked sword has no `ws_gen`

WHEN the server restarts on the framework build
THEN a Survival Web Sword craft is refunded with `andrew.web_sword.craft_blocked` and no broadcast,
AND P's HUD shows the Web Sword cooling with ≤ 20 s,
AND Q receives exactly one sword on the next spawn,
AND the gen-less sword casts.
