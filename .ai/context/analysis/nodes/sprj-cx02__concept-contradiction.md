---
type: "concept-contradiction"
node_id: "L0-sprj-cx02"
source_channel: "rollout"
analysis_version: 1
title: "Contradiction: ADR-022's lethal branch uses `applyDamage`, which C-15 forbids from being reducible"
aliases: ["L0-sprj-cx02"]
is_a: ["contradiction"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1545
tags: ["is_a:contradiction","open","category:invariant-violation","target:L0-sprj","severity:low","resolved"]
level: 2
closed_at: 2026-09-24
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-sprj-cx02
---

# Contradiction: ADR-022's lethal branch uses `applyDamage`, which C-15 forbids from being reducible

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-sprj-r003", "L0-sprj-p003"]` · **Target:** `L0-sprj` · **Category:** invariant violation (L0 ADR vs L0 constraint) · **Severity:** Low · **Status:** open. The CTR number is L0's to assign.

**C-15:** "Armor, Protection enchantments **and resistance effects** must not reduce it."

**ADR-022:** when `cur ≤ 3`, `applyDamage(cur + 1000, { cause: entityAttack, … })`.

**Engine behaviour:**
- The `+1000` overkill beats armour and Protection, but **Resistance V** (amplifier 4) cancels `entityAttack` damage entirely. The "lethal" hit then deals 0, while the non-lethal branch would have taken 3.
- The same happens with any other script that cancels damage in `entityHurt` before-hooks, if one is ever added.
- The result is non-monotonic: a target at 4 HP loses 3, while a target at 3 HP under Resistance V loses nothing.

**Options for L0 (not self-resolved):**
- (a) Accept it. Resistance V is only reachable through commands, not survival play, so document it as a known exception to C-15.
- (b) On the lethal branch, first `setCurrentValue(1)`, then `applyDamage`. The target always drops to at least 1 HP, which keeps the vanilla death path when damage is allowed.
- (c) `setCurrentValue(0)`. That breaks the death message, kill credit and Totem, which ADR-022 wanted to keep.

The interim implementation follows ADR-022 as written, under option (a).
