---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac03"
source_channel: "rollout"
analysis_version: 2
title: "AC — interior corridor + 4 rooms, one lamp per room"
aliases: ["L0-airs-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 439
tags: ["is_a:acceptance-criterion", "interior", "lighting", "verify:unit", "verify:bds"]
level: 2
---
# AC — interior corridor + 4 rooms, one lamp per room

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its interior is inspected, **THEN** it has exactly 1 central corridor and 4 small rooms, each room has exactly 1 ceiling lamp, and the spawner cell's light level stays within the engine's spawner-suppression threshold despite the decorative lighting.

(Spec §5.2; raw test 27.)
