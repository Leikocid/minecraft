---
type: "concept-assumption"
node_id: "L0-sprj-as02"
source_channel: "rollout"
analysis_version: 1
title: "ASM (sprj-02) — The leash is 3D Euclidean distance, and self-launch may end the volley"
aliases: ["L0-sprj-as02"]
is_a: ["assumption"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1166
tags: ["is_a:assumption", "CAN_ASSUME", "leash"]
level: 2
---
# ASM (sprj-02) — The leash is 3D Euclidean distance, and self-launch may end the volley

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-r004", "L0-sprj-r008", "ASM-015", "ASM-019"]`

**Assumed.** "В радиусе 20 блоков от исходной точки" is a sphere: `|target.location − launchPoint| ≤ 20`, measured on feet positions and including the Y axis. This matches `L0-stgt`'s selection metric (ASM-015).

**Side effect accepted.** The ability's own launch (about 10 blocks up, ASM-019) can push the target out of the sphere. A target hit at 18 horizontal blocks reaches about √(18² + 10²) ≈ 20.6 at the apex, so the remaining projectiles vanish. That can only happen *after* a hit, so the outcome is `ESCAPED_AFTER_HIT` with a full cooldown. The spec is not violated, but that volley can land fewer than 3 hits.

**Impact if wrong.** If the owner means a horizontal (cylindrical) radius, the leash test ignores Y. The code change is one line, and §8 tests 8 and 9 are unaffected when run on flat ground. Under the sphere reading, test 7 (9 HP from 3 hits) must be run with the target well inside the radius (≤ 15 blocks).
