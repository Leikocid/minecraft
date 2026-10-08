---
type: "concept-assumption"
node_id: "L0-xasm29"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "ASM-L0-29 · Reading \"10 HP before armour\""
aliases: ["L0-xasm29"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1076
tags: ["v8", "storm-blade", "CAN_ASSUME"]
---
---
title: "ASM-L0-29 · 'Before armour' means armour, Protection and Resistance then reduce it"
aliases: ["L0-xasm29", "Pre-armour damage reading"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-adr-sbdm", "L0-xcx27"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
---
# ASM-L0-29 · Reading "10 HP before armour"

**Assumption (CAN_ASSUME):** "10 HP (6 HP) of damage ДО учёта брони и прочих стандартных защит" means the *raw* damage is 10 (6). Armour, toughness, Protection enchantments and Resistance **then reduce** it, as they would a vanilla hit. It is **not** true damage like the Sculk Crossbow's (C-28). §07's "10 HP before armor" and §06's "+6 HP before armour" read the same way. The difficulty does not scale it: player-sourced damage is never scaled.

**Impact if wrong:** if Andrey meant "ignores armour", the damage path switches to the crossbow's `hit.ts` true-damage pattern with cause `sonicBoom`. That is a contained change in `src/storm/damage.ts`, plus re-run tests against the armoured target.
