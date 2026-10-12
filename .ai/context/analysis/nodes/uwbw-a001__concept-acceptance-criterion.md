---
type: "concept-acceptance-criterion"
node_id: "L0-uwbw-a001"
source_channel: "rollout"
analysis_version: 10
title: "AC-uwbw-001 (bds) · Mace and rocket recipes run alongside vanilla and give vanilla items"
aliases: ["L0-uwbw-a001"]
is_a: ["acceptance-criterion"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 871
tags: ["v10", "underwater-bow", "bds", "recipes", "§5-1"]
level: 2
---
# AC-uwbw-001 (bds) · Mace and rocket recipes run alongside vanilla and give vanilla items

**Links.** relates_to: L0-uwbw-r004, L0-uwbw-prcp. Spec §5 bullet 1.

- **Mace.** GIVEN a Crafter loaded with Iron Block over Breeze Rod, WHEN it crafts, THEN exactly 1 `minecraft:mace` drops with no lore and no dynamic properties, and its durability equals a vanilla Mace's max.
- **Vanilla Mace.** GIVEN Heavy Core over Breeze Rod, THEN 1 `minecraft:mace` also drops.
- **Rockets.** GIVEN Paper over String, THEN exactly 3 `minecraft:firework_rocket` drop. GIVEN Paper + Gunpowder (shapeless), THEN vanilla rockets still drop.
- **Shape uniqueness (unit, `in_process`).** No shape in `packs/behavior/recipes/*.json` or the vanilla list collides with ` R / BWB / S `, `I / Z` or `P / S`.
- **Negative control.** Iron *Ingot* over Breeze Rod, and Paper over Stick, craft nothing.
