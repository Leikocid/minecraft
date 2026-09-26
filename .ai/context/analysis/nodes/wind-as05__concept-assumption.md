---
type: "concept-assumption"
node_id: "L0-wind-as05"
source_channel: "rollout"
analysis_version: 2
title: "Assumption — \"best available dry land position\" = lowest earthwork score, ties broken by distance to spawn"
aliases: ["L0-wind-as05"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 751
tags: ["is_a:assumption", "CAN_ASSUME", "spawn-windmill", "site-prep", "relates_to:L0-wind-p002"]
level: 2
---
# Assumption — "best available dry land position" = lowest earthwork score, ties broken by distance to spawn

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-p002, L0-wind-e004, L0-wind-r007]`

- Eligible: liquid surface share ≤ 5 % *before* prep (dry land), no collision, all blocks in the prep volume on the natural whitelist, within 500 blocks.
- `score = cutVolume + fillVolume + 50·max(0, Δ − 2B) + 0.1·distance`. Lowest wins.
- The spec does not define "лучшая"; it does say the forced site must be dry land, and prefer nearer sites in stages 1–2.
- **Impact if wrong:** medium-low. The Windmill may appear farther from spawn than a client expects, or on a site that needs more earthwork. Weights are tunable.
