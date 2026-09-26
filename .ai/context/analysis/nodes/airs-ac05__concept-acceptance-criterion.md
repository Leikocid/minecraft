---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac05"
source_channel: "rollout"
analysis_version: 2
title: "AC — exactly one iron-axe Vindicator spawner at the corridor centre"
aliases: ["L0-airs-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 372
tags: ["is_a:acceptance-criterion", "spawner"]
level: 2
---
# AC — exactly one iron-axe Vindicator spawner at the corridor centre

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its spawner is inspected, **THEN** there is exactly 1 `mob_spawner`, positioned at the corridor's centre, and it produces Vindicators equipped with a vanilla iron axe.

(Spec §5.3; raw test 29.)
