---
type: "concept-assumption"
node_id: "L0-scyt-as02"
source_channel: "rollout"
analysis_version: 1
title: "ASM-scyt-02 — \"About 10 blocks\" = `applyKnockback` vertical 1.35 (model-derived; the apex is not re-measured) `CAN_ASSUME`"
aliases: ["L0-scyt-as02"]
is_a: ["assumption"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 875
tags: ["is_a:assumption", "assumption", "launch", "delta:2026-09-26"]
level: 2
---
# ASM-scyt-02 — "About 10 blocks" = `applyKnockback` vertical 1.35 (model-derived; the apex is not re-measured) `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r006"]`

**Resolved by measurement plus a model:** strength 2.5 was measured at +29.29 blocks, which fits v₀ in blocks per tick with gravity 0.08 and drag 0.98. The same model gives 1.35 → +10.1. `LAUNCH_STRENGTH = 1.35` is what shipped.

**Still assumed:**
- The ±2-block tolerance on flat ground.
- Mobs fly the same as players. `applyKnockback` is declared on `Entity`, but mob knockback resistance and mass differ; a cow at 10 HP was seen dying from the fall.
- Netherite knockback resistance is not compensated.

**Impact if wrong:** it is one constant. `scythe_launches_target` should assert the apex at 1.35 (8–12). Today it only proves the calibration run.
