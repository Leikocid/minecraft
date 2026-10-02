---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad06"
source_channel: "rollout"
analysis_version: 5
title: "ADR-scyt-06 — Non-lethal hit = `applyDamage(3)` for the feedback, then `setCurrentValue` for the exact value"
aliases: ["L0-scyt-ad06"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1350
tags: ["is_a:architecture-decision", "damage", "feedback", "delta:2026-09-26"]
level: 2
---
# ADR-scyt-06 — Non-lethal hit = `applyDamage(3)` for the feedback, then `setCurrentValue` for the exact value

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-r005", "L0-sprj-cx02"]`

Status: **implemented** in `302fba4` (0.4.2). It amends `decision-scythe-true-damage`.

**Context.** Operator report, 2026-09-26: the volley "does not damage mobs", and there is no red flash. A GameTest showed the damage did land (10 → 7 → 4 → 1), but a bare `setCurrentValue` bypasses the damage pipeline: no flash, no sound and no aggro. In game that looked like the projectiles did nothing.

**Decision.** For a non-lethal hit, call `target.applyDamage(3, { cause: entityAttack, damagingEntity: owner? })` first, then `health.setCurrentValue(hp − 3)`. The write fixes any armour or Protection absorption and covers invulnerability-window swallowing. The lethal branch (`hp + 100`) is unchanged.

**Rejected.**
- `setCurrentValue` only. It gives no feedback, which caused the bug.
- `applyDamage` only. Armour would reduce it, which breaks §4's exact 3 HP.
- Particles or sounds added by script. They fake the feedback, and mob aggro still would not happen.

**Verified:** `scythe_three_hits_true_damage` still shows exactly 9 HP through diamond armour. `scythe_hits_mob_when_alone` asserts that `entityHurt` fired.
