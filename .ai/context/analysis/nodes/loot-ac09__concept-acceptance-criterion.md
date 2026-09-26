---
type: "concept-acceptance-criterion"
node_id: "L0-loot-ac09"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 341
tags: ["is_a:acceptance-criterion", "relates_to:L0-loot-p002", "relates_to:L0-wrdn", "source:spec-13.6-AC48"]
level: 2
---
GIVEN Mini Warden City's 10 chests, WHEN their contents are inspected, THEN all 10 use the real vanilla `chests/ancient_city` loot table unmodified — including the normal possibility of rare vanilla drops such as Enchanted Golden Apple or Swift Sneak books — and the custom weighted table is never applied to them.

Source: spec §13.6, AC48.
