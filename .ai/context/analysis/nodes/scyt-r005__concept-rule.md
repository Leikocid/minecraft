---
type: "concept-rule"
node_id: "L0-scyt-r005"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-005 — Exactly 3 HP per hit, delivered through the damage pipeline"
aliases: ["L0-scyt-r005"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1177
tags: ["is_a:rule", "damage", "true-damage", "delta:2026-09-26"]
level: 2
---
# R-scyt-005 — Exactly 3 HP per hit, delivered through the damage pipeline

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-ad06", "L0-sprj", "L0-sprj-cx02"]`

Source: spec §4, `decision-scythe-true-damage`, fix `302fba4`. Code: `strike`, `trueDamageOutcome`. GameTests: `scythe_three_hits_true_damage`, `scythe_hits_mob_when_alone`, `scythe_lethal_hit_kills`.

**Rule:** each hit leaves the target with exactly `hp − 3`, whatever armour, Protection or Resistance it has. 3 hits take 9 HP, the same through diamond armour. Both players and mobs are affected.

**Mechanism (`L0-scyt-ad06`):**
- **non-lethal** (`hp − 3 > 0`): `applyDamage(3, {cause: entityAttack, damagingEntity: owner if valid})`, then `health.setCurrentValue(hp − 3)`. The event gives the red flash, the hurt sound and mob aggro. The write corrects whatever armour absorbed, and also covers the invulnerability window swallowing the event;
- **lethal** (`hp − 3 ≤ 0`): `applyDamage(hp + 100, …)`, so the death message, kill credit and totem all work.

**Consequence:** a non-lethal hit now fires `entityHurt`, which the GameTest asserts. Aggro makes a hit mob turn on the owner.
