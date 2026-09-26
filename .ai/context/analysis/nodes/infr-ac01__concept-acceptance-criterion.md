---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac01"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-infr-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 308
tags: ["is_a:acceptance-criterion", "channel:build"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN a clean clone of the repository, WHEN `npm run build` is run, THEN it produces `dist/andrew.mcaddon` and `tsc` compiles `src/` with no errors against the installed `@minecraft/server` types. [src: stage-0-infrastructure criterion 1]
