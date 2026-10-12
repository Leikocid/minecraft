---
type: "concept-rule"
node_id: "L0-ench-r002"
source_channel: "rollout"
analysis_version: 10
title: "R-ench-002 · Vanilla conflict groups are never combined"
aliases: ["L0-ench-r002"]
is_a: ["rule"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1445
tags: ["v10", "enchanting", "conflicts"]
level: 2
---
# R-ench-002 · Vanilla conflict groups are never combined

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-ench-r001, L0-ench-ac04

**Rule.** No roll result ever holds two members of the same conflict group. Each group is mutually exclusive inside itself.

| Group | Members (Bedrock ids) |
|---|---|
| Protection | protection, fire_protection, blast_protection, projectile_protection |
| Damage | sharpness, smite, bane_of_arthropods |
| Mace damage | density, breach, smite, bane_of_arthropods |
| Mining | silk_touch, fortune |
| Boots | depth_strider, frost_walker |
| Bow | infinity, mending |
| Crossbow | multishot, piercing |
| Trident | riptide vs loyalty; riptide vs channeling |

The table is the *expected* 1.26.51 set. The probe's `canAddEnchantment` pass is authoritative: for each pair it adds A, then asks about B. Any pair the engine refuses joins a group, and any pair it accepts leaves one. Spear enchantments (Lunge) take whatever the probe measures.

**Order.** Conflicts are resolved when a member is chosen: later picks lose. The rare stage's guaranteed member is chosen first, so it can never be pushed out by a standard pick.

**Enforcement.** The final guard in `L0-ench-roll` step 6 throws on any conflicting pair. A fuzz test (`ac04`) runs ≥ 10 000 random requests over every item and every tier, and expects 0 throws and 0 pairs.

**Source:** spec v2 §4 ("несовместимые чары не совмещаются"); §5 bullet 6.
