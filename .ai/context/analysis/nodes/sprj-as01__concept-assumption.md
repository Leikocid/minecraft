---
type: "concept-assumption"
node_id: "L0-sprj-as01"
source_channel: "rollout"
analysis_version: 1
title: "ASM (sprj-01) — Absorption hearts are consumed first; if they cannot be read, the effect is removed"
aliases: ["L0-sprj-as01"]
is_a: ["assumption"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1376
tags: ["is_a:assumption", "CAN_ASSUME", "true-damage", "absorption"]
level: 2
---
# ASM (sprj-01) — Absorption hearts are consumed first; if they cannot be read, the effect is removed

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-p003", "L0-sprj-r003", "ADR-022"]`. ADR-022 defers this to "ASM in `L0-sprj`". L0 assigns the number.

**Assumed.** "3 HP" is taken from the target's total pool, with absorption first, then health, as vanilla damage does. For the implementation:
- If a stable 2.10.0 component exposes the absorption amount (`minecraft:absorption` via `getComponent`, to be probed), subtract `min(3, abs)` from it and the rest from health.
- If absorption cannot be read or written on the stable API, fall back to ADR-022's literal wording: `removeEffect("absorption")` (the hearts are lost), then take the full 3 HP from health.

**Basis.** ADR-022: "Absorption hearts: set them to zero first (count them as HP)". §4 says "броня и защитные зачарования не уменьшают этот урон" and does not mention absorption.

**Impact if wrong.** With the fallback, a target under a Golden Apple loses its absorption **and** 3 HP, so it is over-punished by up to 4 HP on the first hit. That is visible in §8 test 7 only if the test player has absorption, and `L0-sqat` should clear effects before the test. If the owner wants absorption ignored entirely (pure health damage), only `truedamage.ts` changes.
