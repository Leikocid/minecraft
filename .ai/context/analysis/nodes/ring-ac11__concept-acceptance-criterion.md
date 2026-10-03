---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac11"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 794
tags: ["is_a:acceptance-criterion", "verify:bds", "orbital-ac:11", "relates_to:L0-ring-r001", "relates_to:L0-ring-p001"]
level: 2
---
**AC-ring-11 · Five continuous rings, d = 1/7/14/21/28** (Orbital AC-11; `r001`) · **verify: bds**

- **Unit:** `layout({x:0,y:64,z:0})` returns 1 centre + 4 rings. Each ring is closed and 8-connected (every cell has exactly 2 ring neighbours in its 8-neighbourhood), and each cell satisfies |√(dx²+dz²) − r| ≤ 0.75 for r ∈ {3.5, 7, 10.5, 14}. There are no duplicates, and the count is 201.
- **Gametest:** GIVEN a flat dirt pad in the Overworld and an owner 9 blocks from the pad's centre block, aiming at it, WHEN RMB is used, THEN in the activation tick the `andrew:orbital_charge` count tagged with the attack equals `layout().length`. Every charge has y = target.y + 60 and (x, z) equal to a layout column. After the drain, the pad shows craters whose centres match the layout columns.
