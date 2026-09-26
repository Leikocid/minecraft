---
type: "concept-acceptance-criterion"
node_id: "L0-loot-ac04"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 264
tags: ["is_a:acceptance-criterion", "relates_to:L0-loot-r004", "source:spec-AC37"]
level: 2
---
GIVEN multiple armor-category attempts succeed in the same chest, WHEN slots are rolled, THEN identical armor pieces (e.g. two diamond helmets) are permitted to co-occur in one chest — the implementation must not de-duplicate or reject repeats.

Source: spec AC37.
