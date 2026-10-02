---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac03"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 727
tags: ["title:AC-8 (bds) · Obsidian, portal, containers, spawners removed with no drops", "is_a:acceptance-criterion", "channel:bds", "orbital-ac:8", "relates_to:L0-pntr-r003", "relates_to:L0-pntr-r004", "relates_to:L0-pntr-as02"]
level: 2
---
**GIVEN** the column plan contains:
- obsidian and crying obsidian;
- a lit Nether portal (frame and `portal` blocks);
- a chest filled with 27 cobblestone stacks, a barrel, a placed shulker box with items, and a furnace with output;
- a `mob_spawner` and reinforced deepslate.

A snapshot of the `minecraft:item` and `minecraft:xp_orb` entity ids in a 9×9 AABB around the column is taken before the LMB.

**WHEN** an LMB detonates above them.

**THEN**:
- every listed block in the plan is air;
- the portal blocks outside the plan are gone too (vanilla invalidation);
- **zero** new item or XP entities exist in the plan cells' AABB after the job plus 20 ticks.

Neighbour pops outside the plan are excluded (`L0-pntr-as06`).
