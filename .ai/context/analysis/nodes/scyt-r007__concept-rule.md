---
type: "concept-rule"
node_id: "L0-scyt-r007"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-007 — The 20-block leash is centred on the frozen launch point"
aliases: ["L0-scyt-r007"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 986
tags: ["is_a:rule", "leash", "cooldown"]
level: 2
---
# R-scyt-007 — The 20-block leash is centred on the frozen launch point

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-r005", "L0-sprj-as02", "L0-sprj-ac08", "L0-sprj-ac09"]` · source: Scythe §5, §8 tests 8–9.

**Rule:**
- `launchPoint` is the owner's location at successful activation, and it never moves afterwards. If the owner walks, flies or teleports, the centre stays where it was.
- Each tick after movement and hits, if `dist3D(target.location, launchPoint) > 20`, the volley ends:
  - with **0 hits**: the remaining projectiles vanish, there is **no cooldown**, and the ability is ready at once;
  - with **≥ 1 hit**: the remaining projectiles vanish, and a **full 30 s** cooldown applies.
- Normal completion with ≥ 1 hit also applies the full 30 s cooldown. The 30 s is never pro-rated.

**Same radius:** targeting (r001) and the leash use the same centre and the same bound. A target locked at exactly 20.0 is inside. At > 20 it is outside.
