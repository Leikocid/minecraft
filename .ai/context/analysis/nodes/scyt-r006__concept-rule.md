---
type: "concept-rule"
node_id: "L0-scyt-r006"
source_channel: "rollout"
analysis_version: 5
title: "R-scyt-006 — Each hit launches the target about 10 blocks (strength 1.35); fall damage is kept"
aliases: ["L0-scyt-r006"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1124
tags: ["is_a:rule", "launch", "knockback", "delta:2026-09-26"]
level: 2
---
# R-scyt-006 — Each hit launches the target about 10 blocks (strength 1.35); fall damage is kept

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-as02", "L0-scyt-r007"]`

Source: spec §4, `decision-scythe-launch`. Code: `LAUNCH_STRENGTH = 1.35`. GameTest: `scythe_launches_target`.

**Rule:** after the damage, a still-valid target (player **or mob**) gets `applyKnockback({x:0, z:0}, 1.35)`, which is a pure vertical impulse. Horizontal momentum is kept, and fall damage is vanilla and not suppressed.

**Calibration:** the engine treats the strength as the initial vertical velocity in blocks per tick (gravity 0.08, drag 0.98). On BDS the measurement was 2.5 → +29.29 blocks, which matches the model, and the model predicts 1.35 → +10.1 blocks. Knockback resistance is not compensated.

**Stacking:** a hit on an airborne target launches it again from its current height. Three hits can reach about 30 blocks above the launch point, which is why the leash is horizontal (`L0-scyt-r007`). Fall damage can kill a mob that survived the hits: a cow at 10 HP ends at 1 HP and dies from the fall.
