---
type: "concept-assumption"
node_id: "L0-sclk-as01"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-as01"]
is_a: ["assumption"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 773
tags: ["assumption", "CAN_ASSUME", "physics", "probe"]
level: 2
---
**AS-sclk-01 · The bolt's gravity and drag can be tuned to match an arrow (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sclk-ent2", "L0-sclk-p001", "L0-adr-scdm"]`

**Assumption.** With the snowball runtime, `minecraft:projectile.gravity` and `inertia` can be set so that a bolt fired at an arrow's spawn velocity lands within 1 block of where the arrow would land, at 30 blocks on a flat range. The starting values are the vanilla arrow's (gravity 0.05, inertia 0.99), corrected by probe Q9.

**Impact if wrong.** The bolt drops faster or slower than an arrow. Gameplay still works (physical, not hitscan), but aiming feels different from a vanilla crossbow. That is a C-16 deviation noted in the README. No design change.
