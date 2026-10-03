---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac06"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 618
tags: ["acceptance-criterion", "katana", "channel:bds", "T13", "is_a:acceptance-criterion"]
level: 2
---
---
title: "AC-katn-06 (T13, bds): the trail is harmless and bounded"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r007"]
---
GIVEN a husk and a second SimulatedPlayer standing on the A→B line, WHEN the Katana teleport passes over them:
- no `entityHurt` fires for either;
- their velocity stays ≤ 0.01 apart from gravity;
- the entity count in the area does not grow;
- the T10 block snapshot is unchanged.

A wrapped `spawnParticle` counter records between 1 and 130 calls, all within ≤ 10 ticks of the use, and none on a refused or cooldown press. (Visual reading is in `L0-katn-ac09`.)
