---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac04"
source_channel: "rollout"
analysis_version: 2
title: "AC — exactly 10 chests at fixed positions"
aliases: ["L0-airs-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 418
tags: ["is_a:acceptance-criterion", "chests", "verify:unit", "verify:bds"]
level: 2
---
# AC — exactly 10 chests at fixed positions

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its chests are counted, **THEN** there are exactly 10: 2 in each of the 4 rooms (8 total) and 2 in the corridor, all at the same template-local positions (rotated per instance) across every instance, each reachable without breaking blocks.

(Spec §5.3; raw test 28.)
