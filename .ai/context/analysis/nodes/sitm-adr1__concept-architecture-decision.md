---
type: "concept-architecture-decision"
node_id: "L0-sitm-adr1"
source_channel: "rollout"
analysis_version: 1
title: "ADR — Enchantment slot = sword, resolving Q-021 / CTR-012"
aliases: ["L0-sitm-adr1"]
is_a: ["architecture-decision"]
part_of: ["L0-sitm"]
relates_to: ["L0-sitm"]
priority: 520
size_chars: 1464
tags: ["scythe-of-calamity", "adr", "Q-021"]
level: 2
---
**Links:** `part_of: ["L0-sitm"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sitm-rul2"]`

# ADR — Enchantment slot = sword, resolving Q-021 / CTR-012

**Context.** Spec §1 says the base item is a Diamond Hoe and that "compatible vanilla enchantments of the base item" are allowed if they don't conflict with the mechanic. Taken literally, that means `minecraft:enchantable: { slot: "hoe" }`, offering Efficiency/Fortune/Silk Touch/Unbreaking/Mending. But the item has no durability (making Unbreaking/Mending meaningless) and its `Use` action is entirely consumed by the active ability (making Efficiency/Fortune/Silk Touch meaningless, since the item never mines). A literal hoe-slot reading therefore ships a combat weapon with zero useful enchantments while ruling out Sharpness/Smite/Fire Aspect/Knockback, which would actually suit its melee role — the tension this open contradiction (CTR-012) flags.

**Decision.** `minecraft:enchantable: { slot: "sword", value: 10 }`, matching the Web Sword's shipped precedent exactly.

**Rejected alternative.** Keep `slot: "hoe"` per the spec's literal wording. Rejected because it leaves the weapon with no combat-relevant enchantment options, contradicts the weapon's actual (sword-damage, no-mining) design, and breaks consistency with the only other shipped legendary.

**Consequence.** Informs the resolution of CTR-012 in the project's contradiction register; the reducer should mark it accordingly.
