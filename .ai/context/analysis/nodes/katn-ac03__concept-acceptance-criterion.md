---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac03"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 918
tags: ["acceptance-criterion", "katana", "channel:bds", "T05", "T06", "is_a:acceptance-criterion"]
level: 2
---
---
title: "AC-katn-03 (T05, T06, bds): open-range teleport, cooldown, clamp, no-op on cooldown"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-r002", "L0-katn-r005", "L0-xasm18"]
---
- **T05.** GIVEN a flat floor and a SimulatedPlayer facing +X, looking at a floor block 19 blocks ahead, WHEN Use runs with the Katana, THEN in the same tick the feet are on top of that block (±0.5) and the yaw is unchanged. `andrew:cd_dragon_katana − Date.now()` lies in 29 500–30 000 ms.
- **Cooldown no-op.** WHEN Use runs again 1 s later, THEN the position is unchanged and the cooldown value is bit-identical.
- **T06.** GIVEN open air ahead and a 60-block runway, WHEN the player looks level and uses, THEN the head displacement is ≤ 20.0 and ≥ 19.0. A play with the yaw at 45° also holds ≤ 20.0.
- **Off hand.** The Katana in the off hand with the main hand empty → the same teleport.
