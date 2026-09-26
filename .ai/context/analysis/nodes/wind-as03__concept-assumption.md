---
type: "concept-assumption"
node_id: "L0-wind-as03"
source_channel: "rollout"
analysis_version: 2
title: "Assumption — blend band B = 6 blocks (grows to Bmax = 12), slope ≤ 1 block per block"
aliases: ["L0-wind-as03"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 655
tags: ["is_a:assumption", "CAN_ASSUME", "site-prep", "tuning", "relates_to:L0-wind-r009"]
level: 2
---
# Assumption — blend band B = 6 blocks (grows to Bmax = 12), slope ≤ 1 block per block

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r009, L0-wind-e004, L0-wind-p003]`

- The spec only says "плавно соединять края … избегая грубой квадратной платформы с вертикальными стенами". Numbers are ours.
- B = 6 absorbs a 6-block height difference at slope 1. If larger, B grows up to 12; beyond that the candidate score is penalised so the search prefers gentler sites.
- **Impact if wrong:** visual only (iPad review, C-9). Wider band = more terrain changed around the Windmill; narrower = steeper banks. Tunable constants.
