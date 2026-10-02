---
type: "concept-assumption"
node_id: "L0-wind-as10"
source_channel: "rollout"
analysis_version: 5
title: "Assumption — installing into an existing world runs the spawn search once, with the natural-block whitelist protecting player builds"
aliases: ["L0-wind-as10"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 774
tags: ["is_a:assumption", "CAN_ASSUME", "existing-world", "spawn-windmill", "relates_to:L0-wind-r008", "relates_to:L0-wind-r011"]
level: 2
---
# Assumption — installing into an existing world runs the spawn search once, with the natural-block whitelist protecting player builds

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r008, L0-wind-r011, L0-wind-p002]`

- §4.7 note: the primary scenario is a new world; for an existing world "при необходимости допускается аналогичная одноразовая инициализация". We read "допускается" as *do it*, same rules.
- Player builds are not "detected structures" in the spec's sense, but the whitelist (`L0-wind-r008`) rejects any site containing crafted blocks, so a base is never flattened.
- **Impact if wrong:** medium. If the client wants no spawn Windmill in existing worlds, a single guard (world age / existing registry) skips the search.
