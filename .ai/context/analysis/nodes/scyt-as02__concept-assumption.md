---
type: "concept-assumption"
node_id: "L0-scyt-as02"
source_channel: "rollout"
analysis_version: 1
title: "ASM-scyt-02 — \"About 10 blocks\" is an apex of 8–12 blocks, reached with one calibrated `applyKnockback` vertical strength `CAN_ASSUME`"
aliases: ["L0-scyt-as02"]
is_a: ["assumption"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 969
tags: ["is_a:assumption", "CAN_ASSUME", "launch", "probe"]
level: 2
---
# ASM-scyt-02 — "About 10 blocks" is an apex of 8–12 blocks, reached with one calibrated `applyKnockback` vertical strength `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r006", "L0-sprj-as04"]`

**Assumed:**
- The tolerance for «примерно на 10 блоков» is ±2 blocks on flat ground, with no Jump Boost or Levitation and no knockback resistance.
- The vertical strength is a single constant. Start at about 2.5 and tune it on BDS 1.26.51.1 by logging the peak `location.y` of a SimulatedPlayer. The exact value depends on engine drag and gravity, so it cannot be derived on paper.
- Netherite armour's knockback resistance is **not** compensated (`L0-sprj-as04`), so an armoured target flies lower.

**Impact if wrong:** if the client expects exactly 10 regardless of armour, compensate by scaling with the target's knockback resistance or use `setVelocity`-style teleport steps. The change is local to the hit adapter.
