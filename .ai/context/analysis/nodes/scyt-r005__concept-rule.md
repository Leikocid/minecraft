---
type: "concept-rule"
node_id: "L0-scyt-r005"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-005 — Exactly 3 HP true damage per hit"
aliases: ["L0-scyt-r005"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 985
tags: ["is_a:rule", "true-damage"]
level: 2
---
# R-scyt-005 — Exactly 3 HP true damage per hit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-sprj-cx02", "L0-sprj-as01", "ADR-022", "C-15"]` · source: Scythe §4, §7, §8 tests 6–7.

**Rule:** each projectile that hits takes **exactly 3.0 HP** (1.5 hearts) from the target. Armour, armour toughness, Protection (any type) and Resistance do not reduce it.
- 3 hits = 9 HP.
- The damage is not scaled by difficulty, and it is not modified by melee enchantments on the Scythe (Sharpness does nothing here).

**Mechanism (ADR-022, detailed in `L0-sprj`):**
- non-lethal: `health.setCurrentValue(cur − 3)`;
- lethal (cur ≤ 3): the vanilla `applyDamage` path, so the death message, kill credit and Totem of Undying still work.

The Resistance V edge case is open in `L0-sprj-cx02`. Absorption hearts are consumed first (`L0-sprj-as01`).

**Hurt feedback:** play the hurt sound or animation if the API allows it. It is cosmetic and not part of the rule.
