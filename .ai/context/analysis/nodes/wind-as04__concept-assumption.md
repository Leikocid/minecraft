---
type: "concept-assumption"
node_id: "L0-wind-as04"
source_channel: "rollout"
analysis_version: 5
title: "Assumption — \"shallow void\" depth D = 4 blocks below the target surface"
aliases: ["L0-wind-as04"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 653
tags: ["is_a:assumption", "CAN_ASSUME", "site-prep", "tuning", "relates_to:L0-wind-r010"]
level: 2
---
# Assumption — "shallow void" depth D = 4 blocks below the target surface

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r010, L0-wind-e004]`

- Voids within 4 blocks under the levelled surface, and only under cells that need support, are filled. Anything deeper stays open under a 4-block natural cap.
- 4 blocks is enough to hold the template foundation and farmland/water ditches; the spec forbids filling deep caves "целиком".
- **Impact if wrong:** low–medium. Smaller D risks thin caps over caves (players may fall through when digging); larger D starts to look like plugging caves. One constant; iPad review.
