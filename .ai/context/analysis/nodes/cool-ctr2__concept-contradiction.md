---
type: "concept-contradiction"
node_id: "cool-ctr2"
source_channel: "rollout"
analysis_version: 1
title: "CTR-2 · Scythe is a Diamond Hoe base but deals Netherite-Sword melee damage — which enchantments apply?"
aliases: ["cool-ctr2"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 872
tags: ["target:L0-scyt","status:resolved","category:internal-inconsistency","title:Scythe hoe base vs weapon enchantments","resolved"]
closed_at: 2026-09-24
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-cool-ctr2
---

# CTR-2 · Scythe is a Diamond Hoe base but deals Netherite-Sword melee damage — which enchantments apply?

**Statement 1** — Scythe §1: base = Diamond Hoe; melee damage = Netherite Sword (`minecraft:damage: 8`; the hit takes 9 HP, same as a vanilla netherite sword, GameTest on BDS 1.26.51.1).
**Statement 2** — Scythe §1: «Совместимые ванильные зачарования **базового предмета** разрешены, **если они не конфликтуют с механикой**».

Hoe-slot enchantments are Efficiency, Fortune, Silk Touch, Unbreaking, Mending — none affect combat, and Unbreaking/Mending are meaningless with infinite durability. Meanwhile the item is meant as a melee PvP weapon (Netherite-Sword damage), where players would expect Sharpness/Smite/Fire Aspect/Knockback/Looting (sword slot). The spec doesn't say which slot the custom item uses.

**Resolution needed.** Pick the `minecraft:enchantable` slot for the Scythe: `hoe` (literal reading) or `sword` (weapon-role reading).
