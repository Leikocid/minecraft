---
type: "concept-rule"
node_id: "L0-katn-r007"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r007"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1056
tags: ["rule", "katana", "particles", "performance", "is_a:rule"]
level: 2
---
---
title: "R-katn-007: Cherry-petal trail A→B, one-shot and harmless"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-as03"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
---
**Rule** (C-5e).
- The trail is spawned **only** on a successful teleport.
- `dimension.spawnParticle` is called at points every 0.5 block from A+1 to B+1: at most 41 points, about 3 particles per point.
- It runs in the activation tick, or spread over ≤ 10 ticks through the shared interval. Nothing is scheduled after that.
- **Particle.** `minecraft:cherry_leaves_particle` if probe (4) shows it renders when spawned by script on iPad. Otherwise a custom RP particle `andrew:katana_petal`: a pink billboard, lifetime ≤ 1.5 s, no collision.
- **Visibility.** `spawnParticle` is broadcast to clients in range, so nearby players see it (§8).
- **Harmless.** No entity is spawned, no damage, no knockback, no block change, no sound requirement.
- Points in unloaded chunks are skipped silently.

Source: Katana §8, §14; T13.
