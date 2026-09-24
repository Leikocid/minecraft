---
type: "concept-glossary-term"
node_id: "L0-sprj-gl04"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-sprj-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 421
tags: ["is_a:glossary-term"]
level: 2
---
**True damage** (истинный урон)

Damage that armour, Protection enchantments and Resistance do not reduce: exactly 3.0 HP per Scythe projectile hit (C-15). It is implemented as a direct write to `EntityHealthComponent`, with the vanilla `applyDamage` path used only for the killing blow (ADR-022, `L0-sprj-r003`).

**Not:** the Scythe's melee damage, or fall damage after the launch. Both are ordinary, reducible damage.
