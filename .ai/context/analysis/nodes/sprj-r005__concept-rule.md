---
type: "concept-rule"
node_id: "L0-sprj-r005"
source_channel: "rollout"
analysis_version: 1
title: "R-sprj-005 — Cooldown outcome: any hit ⇒ full 30 s, no hit ⇒ no cooldown"
aliases: ["L0-sprj-r005"]
is_a: ["rule"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1028
tags: ["is_a:rule", "cooldown", "fsm"]
level: 2
---
# R-sprj-005 — Cooldown outcome: any hit ⇒ full 30 s, no hit ⇒ no cooldown

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-ent3", "L0-sprj-ad01", "L0-lgnd", "ADR-025", "ASM-017", "ASM-023"]` · source: Scythe §5, §8 tests 8–9.

**Rule:**
- The target leaves the leash before the first hit → the remaining projectiles vanish, **no cooldown**, and the ability is ready as soon as busy is released (same tick).
- The target leaves after ≥ 1 hit → the remaining projectiles vanish, **full 30 s cooldown**.
- Normal completion with ≥ 1 hit → full 30 s.
- Every other terminal outcome (`L0-sprj-ent3`) follows the same split on `hits`.

**Duration:** the 30 s is always the full `cooldownMs` from the `LegendaryDef`, never pro-rated. It counts from the end of the volley (ASM-017). The first-hit commit (`L0-sprj-ad01`) only guarantees that a cooldown exists if the volley never reaches a clean end.

**Ownership:** this component decides *whether* the cooldown starts. `L0-lgnd` stores it and shows it.
