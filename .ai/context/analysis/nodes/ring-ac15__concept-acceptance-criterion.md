---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac15"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-ac15"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 448
tags: ["is_a:acceptance-criterion", "verify:bds", "orbital-ac:15", "relates_to:L0-ring-r007", "relates_to:L0-ring-ad03"]
level: 2
---
**AC-ring-15 · Underwater: damage only** (Orbital AC-15; `r007`) · **verify: bds**

GIVEN a flat pad where the half with x < 0 is covered by 4 blocks of water and the half with x ≥ 0 is dry, with a zombie on the seabed 3 blocks from the target at x < 0. WHEN RMB is fired at the boundary, THEN:
- every block within footprint ± 6 with x ≤ −2 is identical before and after (`getBlock` type snapshot);
- the dry half shows craters;
- the zombie took damage or died.
