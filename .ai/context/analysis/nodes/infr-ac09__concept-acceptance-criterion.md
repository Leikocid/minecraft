---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac09"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 473
tags: ["channel:bds", "is_a:acceptance-criterion", "relates_to:L0-infr-p006", "v2-delta"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p006"]`

GIVEN a template built into the pack, WHEN the BDS/GameTest placement test places it via `structureManager.place` in each of the 4 rotations (0/90/180/270) in the `gametest` world, THEN in-world block-entity counts and states (chest count, spawner `EntityIdentifier`, shrieker `can_summon`) match the compiled template in every rotation. [src: L0-adr-tmpl; L0-infr-p006]
