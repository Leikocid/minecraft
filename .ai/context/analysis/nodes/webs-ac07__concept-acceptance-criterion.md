---
type: "concept-acceptance-criterion"
node_id: "L0-webs-ac07"
source_channel: "rollout"
analysis_version: 2
level: 2
aliases: ["L0-webs-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 551
tags: ["acceptance-criterion", "channel:bds", "unloaded-chunks"]
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
**AC-webs-07 (channel: bds).** GIVEN a target near the edge of the loaded/simulated area such that part of the 3×3×3 volume falls outside it, WHEN the ability is used, THEN the component never forces those chunks to load or writes into them — those cells are treated as `skipped-unloaded` (same as a protected cell) and the rest of the volume fills normally. Source: spec §6 ("не пытаться создавать паутину вне загруженной/доступной области") and §12 edge case.
