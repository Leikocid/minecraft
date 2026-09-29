---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac11"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-ring-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 794
tags: ["is_a:acceptance-criterion", "verify:bds", "orbital-ac:11", "relates_to:L0-ring-r001", "relates_to:L0-ring-p001"]
level: 2
---
**AC-ring-11 · Five continuous rings, d ≈ 1/5/10/15/20** (Orbital AC-11; `r001`) · **verify: bds**

- **Unit:** `layout({x:0,y:64,z:0})` returns 1 centre + 4 rings. Each ring is closed and 8-connected (every cell has exactly 2 ring neighbours in its 8-neighbourhood), and each cell satisfies |√(dx²+dz²) − r| ≤ 0.75 for r ∈ {2.5, 5, 7.5, 10}. There are no duplicates, and the count is 140–160.
- **Gametest:** GIVEN a flat stone pad in the Overworld and an owner holding the Cannon aimed at the pad's centre block, WHEN RMB is used, THEN in the activation tick the `andrew:orbital_charge` count tagged with the attack equals `layout().length`. Every charge has y = target.y + 30 and (x, z) equal to a layout column. After the drain, the pad shows craters whose centres match the layout columns.
