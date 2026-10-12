---
type: "concept-acceptance-criterion"
node_id: "L0-uwbw-a003"
source_channel: "rollout"
analysis_version: 10
title: "AC-uwbw-003 (bds) · Arrows keep air speed in water and lava"
aliases: ["L0-uwbw-a003"]
is_a: ["acceptance-criterion"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 823
tags: ["v10", "underwater-bow", "bds", "flight", "§5-2", "C-42"]
level: 2
---
# AC-uwbw-003 (bds) · Arrows keep air speed in water and lava

**Links.** relates_to: L0-uwbw-pfly, L0-uwbw-adfl, C-42. Spec §5 bullet 2.

- **Water.** GIVEN a sim player firing a full-draw shot along a 16-block water channel and the same shot through air, THEN after 10 ticks the bow's arrow in water is within ± 10 % of the air arrow's distance and drop.
- **Lava.** GIVEN the same shot through 16 blocks of lava, THEN the arrow stays valid until it hits the target block at the far end, within ± 10 % of the air distance.
- **Attribution.** An arrow fired by a vanilla `minecraft:bow` in the same test is **not** marked, and its water distance is < 50 % of air.
- **Negative control.** With the liquid handling disabled by a test flag, the bow's water arrow falls short by > 50 %. This proves the measurement can go red.
