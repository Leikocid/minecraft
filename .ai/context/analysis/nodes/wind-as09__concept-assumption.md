---
type: "concept-assumption"
node_id: "L0-wind-as09"
source_channel: "rollout"
analysis_version: 2
title: "Assumption — field guards are adults, and zombie villagers do not convert to drowned in the ditches"
aliases: ["L0-wind-as09"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 705
tags: ["is_a:assumption", "CAN_ASSUME", "guards", "relates_to:L0-wind-e003"]
level: 2
---
# Assumption — field guards are adults, and zombie villagers do not convert to drowned in the ditches

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-e003, L0-wind-r004]`

- Guards are spawned as adults (via the entity's adult spawn event if the probe finds one; otherwise vanilla's baby chance is accepted and noted). The spec says only "Zombie Villagers".
- Vanilla Zombie Villagers do not convert to Drowned when submerged (only Zombies/Husks do), so guards walking into the water ditches stay guards. Probe confirms on 1.26.51.
- **Impact if wrong:** low. A baby guard is cosmetic; a drowned conversion would lose one guard's special status — acceptable, recorded.
