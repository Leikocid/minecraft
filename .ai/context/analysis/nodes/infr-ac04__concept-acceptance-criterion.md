---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac04"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-infr-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 535
tags: ["is_a:acceptance-criterion", "channel:ipad", "manual"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the built `.mcaddon` imported on the iPad (or delivered via the LAN server) with both packs enabled in a world, WHEN the player spawns, THEN a chat message appears at `initialSpawn`, and the test item is visible in Creative with both RU and EN names. This criterion is typed `manual`/`ipad`-channel and does not block autopilot merge — a green `bds` run never closes it. [src: stage-0-infrastructure criterion 4; C-6; decision-verification-approach-automatic]
