---
type: "concept-rule"
node_id: "L0-sclk-r007"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r007"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 825
tags: ["rule", "trail", "C-5f", "visual-only", "T04", "T05"]
level: 2
---
**R-sclk-007 · The trail is visual only and bounded (§4, §11, C-5f)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-p003", "L0-sclk-ad02"]`

- The trail is emitted only for a bolt with a live record, from the shared interval, at ≤ `TRAIL_PER_TICK` = 3 particles per bolt per tick. It is placed on the segment between the bolt's last and current real positions.
- Worst case: one player, a Multishot volley of 3 bolts × 3 particles × 100 ticks = 900 particle spawns in 5 s.
- The trail has no damage, no knockback, no block edits, no sound loop and no entity. No dummy entity carries it.
- Nothing lingers after the bolt dies: the particle's own lifetime is ≤ 1 s (an RP look-alike sets `max_lifetime ≤ 1`).
- The bolt itself is the physical projectile. The trail is never a hitscan ray (§9).
