---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac11"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 494
tags: ["channel:bds", "is_a:acceptance-criterion", "relates_to:L0-infr-p007", "relates_to:L0-infr-as04", "v2-delta"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p007", "L0-infr-as04"]`

GIVEN a `gametest` world where at least one structure has completed one-time init, WHEN the BDS server process is restarted without re-staging the world, THEN no chest/spawner/guard/marker is duplicated and the instance registry's `placed`/`lootFilled`/`guardsSpawned` flags are byte-identical before and after the restart. [src: L0-adr-strs; C-7; L0-infr-p007; L0-infr-as04]
