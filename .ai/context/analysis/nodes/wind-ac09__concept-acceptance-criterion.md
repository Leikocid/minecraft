---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac09"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-09 · Fields: mostly mature wheat, water, paths, abandoned patches, old fence with gaps"
aliases: ["L0-wind-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 512
tags: ["is_a:acceptance-criterion", "spec-test:20", "verify:unit", "verify:ipad", "fields"]
level: 2
---
# AC-wind-09 · Fields: mostly mature wheat, water, paths, abandoned patches, old fence with gaps

**Spec:** test 20, §4.4.

GIVEN the template
THEN (unit) ≥ 80 % of wheat blocks have `growth = 7`; water ditch blocks exist; every farmland block is within 4 blocks of water; path blocks connect the fence gaps to the door; the perimeter fence has ≥ 3 gaps; some plot cells are bare dirt / missing wheat
AND (BDS) breaking mature wheat drops wheat and seeds
AND (iPad) the fields look abandoned, not freshly farmed.
