---
type: "concept-rule"
node_id: "L0-lgnd-r010"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-r010"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1056
tags: ["rule", "shadow-blade", "ASM-020", "contract"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-stgt", "L0-sqat", "L0-lgnd-cx03", "L0-lgnd-p007"]
---
**R-lgnd-010: `isHiddenFromTargeting(player)` contract.**

Source: ASM-020; the boundary (Shadow Blade is out of scope, only a read-only predicate); CTR-014; Q-022.

- Signature: `isHiddenFromTargeting(player: Player): boolean`. Pure read, no side effects, safe to call per candidate during a target search.
- Backing store: player dynamic property `andrew:hidden_until`, a number. Hidden iff it is a number **and** greater than `Date.now()`, i.e. epoch ms (see `L0-lgnd-cx03` for why not ticks).
- Absent, non-number or expired → `false`. With no Shadow Blade in the world it always returns false, as the boundary requires.
- Writers: today only `/andrew:hide` and GameTest. Tomorrow, Shadow Blade. No v3 weapon module writes it.
- The key is unprefixed on purpose: it is a cross-weapon contract, not Shadow Blade's private state. If Shadow Blade arrives with a different model (a tag or an effect), only this adapter changes (ASM-020 impact).
