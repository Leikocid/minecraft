---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac03"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 392
tags: ["is_a:acceptance-criterion", "channel:bds"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN `dist/andrew.mcaddon` staged into a BDS world in Docker, WHEN `npm run bds:check` runs, THEN the server log shows no manifest/dependency errors naming the add-on's packs, a `Pack Stack` line names the behavior and selftest pack uuids, and `SCRIPT_LOADED` appears in the log. [src: stage-0-infrastructure criterion 3]
