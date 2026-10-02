---
type: "concept-acceptance-criterion"
node_id: "L0-webs-ac05"
source_channel: "rollout"
analysis_version: 5
level: 2
aliases: ["L0-webs-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 420
tags: ["acceptance-criterion", "channel:bds", "protected-blocks"]
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
**AC-webs-05 (channel: bds).** GIVEN a target whose 3×3×3 volume overlaps a chest and/or bedrock, WHEN the ability is used, THEN the chest/bedrock cells are left completely untouched (no destruction, no data loss) while every other eligible cell in the volume is still filled with Cobweb. Source: spec §13 test 10; decision Q-013.
