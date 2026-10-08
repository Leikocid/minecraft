---
type: "concept-assumption"
node_id: "L0-xasm30"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "ASM-L0-30 · Melee base and the passive trigger"
aliases: ["L0-xasm30"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1544
tags: ["v8", "storm-blade", "CAN_ASSUME"]
---
---
title: "ASM-L0-30 · Diamond-sword parity is measured, and the passive rides main-hand melee only"
aliases: ["L0-xasm30", "Storm Blade melee base"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-scyt"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
---
# ASM-L0-30 · Melee base and the passive trigger

**Assumptions (CAN_ASSUME):**
1. "Damage as a Diamond Sword" is checked **against a vanilla `minecraft:diamond_sword` on the same BDS build**, with the same target and armour. It is never compared to a hard-coded number; Bedrock and Java differ by 1. This follows the Scythe's precedent (`scythe_melee_matches_netherite`). Sharpness, Smite, Bane, Fire Aspect, Knockback and Looting behave as on a vanilla sword. Sweeping does not exist on Bedrock.
2. A "successful hit" for the passive is an `entityHitEntity` by a player whose **main hand** holds a live (non-stale) Storm Blade, on an entity with a health component. Bedrock never melees with the off hand, so an off-hand blade has no passive. Item frames, armour stands without health, dropped items and XP orbs are not "living".
3. The active ability is triggered by **Use** (RMB / long-press on the iPad), as on every other active legendary, through `hands.ts resolveActivation`.

**Impact if wrong:** (1) changes one item-JSON damage value. (2) If off-hand passive was expected, the spec would need a mechanic Bedrock lacks; document it. (3) A different trigger would need a framework hook, which is not allowed in this run, so it would mean a new L0 decision.
