---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac07"
source_channel: "rollout"
analysis_version: 2
title: "AC — independent generation at 2 % on suitable land chunks only"
aliases: ["L0-airs-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 561
tags: ["is_a:acceptance-criterion", "worldgen", "rate"]
level: 2
---
# AC — independent generation at 2 % on suitable land chunks only

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a large enough sample of newly discovered Overworld chunks with no Windmill involved, **WHEN** independent Airship generation is measured statistically, **THEN** the observed rate on suitable chunks (land, valid footprint, no collision) is consistent with a 2 % per-chunk roll, and no Airship appears on an unsuitable chunk (open water, colliding, or failing the altitude/ceiling check).

(Spec §5.5; raw test 32.)
