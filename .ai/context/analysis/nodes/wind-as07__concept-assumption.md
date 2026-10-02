---
type: "concept-assumption"
node_id: "L0-wind-as07"
source_channel: "rollout"
analysis_version: 5
title: "Assumption — spawner zones stay at block light ≤ 7 (Lmax)"
aliases: ["L0-wind-as07"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 771
tags: ["is_a:assumption", "CAN_ASSUME", "lighting", "spawners", "needs-probe", "relates_to:L0-wind-r003"]
level: 2
---
# Assumption — spawner zones stay at block light ≤ 7 (Lmax)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r003, L0-wind-ac06]`

- The exact Bedrock light threshold for monster spawners is not in the spec ("достаточно тёмными"). We keep every cell within 4 blocks horizontally / 1 vertically of each spawner at block light ≤ 7 by placing lanterns only on the far side of each floor (lantern light 15 falls off 1 per block → ≥ 8 blocks away).
- Sky light: the attic has a solid roof; windows avoid spawner line.
- **Impact if wrong:** medium. If Bedrock spawners require light 0, spawners stop working in the lit parts of floors → reposition lanterns in the template (no code change). Probe measures spawn rate with lanterns in place.
