---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac02"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 372
tags: ["is_a:acceptance-criterion", "channel:build"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the built packs, WHEN `npm run validate` (or the validate step inside `npm run build`) runs, THEN every manifest and every item/JSON file under `packs/**` passes structural validation (`validatePacks`/`validateSelfTestPack`) with zero `ValidationError`s. [src: stage-0-infrastructure criterion 2]
