---
type: "concept-acceptance-criterion"
node_id: "L0-pick-ac01"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 291
tags: ["is_a:acceptance-criterion", "channel:bds", "channel:ipad"]
level: 2
---
GIVEN a clean clone, WHEN `npm run build` runs and the resulting `.mcaddon` is loaded on BDS in Docker and imported on iPad, THEN there are no dependency or manifest errors involving this item's manifest/recipe/item entries. [channel: bds + ipad; src: `minerspickaxetestspec` pass criteria]
