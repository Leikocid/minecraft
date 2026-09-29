---
type: "concept-entity"
node_id: "L0-loot-e004"
source_channel: "rollout"
analysis_version: 2
title: "Entity: VanillaLootTableRef"
aliases: ["L0-loot-e004"]
is_a: ["entity"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 565
tags: ["is_a:entity", "relates_to:L0-loot-p002", "relates_to:L0-wrdn", "relates_to:L0-bast"]
level: 2
---
# Entity: VanillaLootTableRef

Identifies which vanilla Bedrock loot table a `L0-loot-p002` chest draws from. Static per chest role.

**Attributes:**
- `tableId` — one of `chests/ancient_city`, `chests/bastion_treasure`, `chests/bastion_other`
- `structure` — wrdn (Mini Warden City) or bast (Mini Bastion)
- `chestRole` — for bast: treasure (3 chests, central) or other (7 chests, distributed); for wrdn: n/a, all 40 chests use the same table

**Relationships:** consumed by `L0-loot-p002`; chest count/position is owned by `L0-wrdn`/`L0-bast`, not this component.
