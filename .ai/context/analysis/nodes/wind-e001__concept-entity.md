---
type: "concept-entity"
node_id: "L0-wind-e001"
source_channel: "rollout"
analysis_version: 5
title: "Entity — `WindmillDef` (the Windmill's `StructureDef` + template contract)"
aliases: ["L0-wind-e001"]
is_a: ["entity"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 2251
tags: ["is_a:entity", "structure-def", "template", "relates_to:L0-strf-e001", "relates_to:L0-adr-tmpl", "relates_to:L0-wind-r001"]
level: 2
---
# Entity — `WindmillDef` (the Windmill's `StructureDef` + template contract)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-strf-e001, L0-adr-tmpl, L0-wind-r001, L0-wind-r003, L0-wind-p004]`

| Field | Value | Source |
|---|---|---|
| `id` | `"windmill"` (registry `d`) | — |
| `nameKey` | `andrew.structure.windmill` → en `Windmill`, ru `Мельница` | §8, C-4 |
| `dimension` | `minecraft:overworld` only | §2, C-14 |
| `chance` | `0.01` | §4.6 |
| `priority` | 0 (first in Overworld chunk order) | `L0-strf-r002` |
| `template` | `andrew:windmill` → `structures/andrew/windmill.mcstructure` | `L0-adr-tmpl` |
| `size` | plot ≈ 35 × 35 (X×Z); building ≈ 15 × 15 base, ≈ 30 high; rotor on the front face, inside the plot | §4.1 |
| `profiles` | `dryLand(maxLiquidShare 0.05)`, `flat(maxDelta 3)` — normal gen only | `L0-strf-r005` |
| `chests` | 25 local points: floor 1 ×5, floor 2 ×8, floor 3 ×12; `table:"shared"` | §4.3 |
| `spawners` | 3 local points (template block entities): F1 `minecraft:zombie_villager_v2`, F2 `minecraft:zombie`, F3 `minecraft:vindicator` | §4.3 |
| `guardPoints` | 10 local points on field paths around the wheat | §4.5 |
| `door` | 1 wooden door, front face, same side as rotor | §4.1 |
| `hooks` | `spawnGuards`, `afterInit` (linked Airship) | `L0-wind-p004` |
| `spawnSearch` | `{ stage1Chunks: 5, maxRadius: 500, allowForcedPrep: true }` | §4.7 |

## Template layers (build-time sources, `infr`)
- **Building:** cobblestone/stone/mossy variants floors 0–1; planks/logs floors 2–3; wooden roof; continuous stair F1→F3; floor 3 = open storage/attic (combat zone).
- **Rotor:** 4 fixed blades (fences/planks/wool-free), non-moving.
- **Plot:** farmland + wheat (`growth` mostly 7), water ditches (hydrating farmland), coarse-dirt/path paths, trampled dirt patches, a few overgrown tufts, perimeter oak fence with ≥ 3 gaps and damaged sections.
- **Decay:** vines on exterior walls and inside; cobwebs in corners, under ceilings, near beams, densest on floor 3; never on the route cells (`L0-wind-r002`).
- **Light:** a few lanterns per floor, placed away from spawner cells (`L0-wind-r003`).

The unit test (`L0-adr-tmpl`) asserts counts, bounds and route reachability from the NBT file itself.
