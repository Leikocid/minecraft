---
type: "concept-acceptance-criterion"
node_id: "L0-loot-ac01"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 296
tags: ["is_a:acceptance-criterion", "relates_to:L0-loot-r001", "source:spec-AC34"]
level: 2
---
GIVEN a Windmill or Airship chest is initialized, WHEN the fill algorithm runs, THEN it performs between 5 and 12 fill attempts inclusive, and each individual attempt yields at most one loot category (never zero-or-more-than-one simultaneous categories from a single attempt).

Source: spec AC34.
