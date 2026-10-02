---
type: "concept-process"
node_id: "L0-wind-p001"
source_channel: "rollout"
analysis_version: 5
title: "Process — normal 1 % Windmill generation"
aliases: ["L0-wind-p001"]
is_a: ["process"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 2280
tags: ["is_a:process", "worldgen", "normal-generation", "relates_to:L0-strf-p001", "relates_to:L0-strf-p002", "relates_to:L0-strf-r002", "relates_to:L0-strf-r005", "relates_to:L0-wind-r006"]
level: 2
---
# Process — normal 1 % Windmill generation

**Links:** `part_of: ["L0-wind"]` · `is_a: ["process"]` · `relates_to: [L0-strf-p001, L0-strf-p002, L0-strf-p003, L0-strf-r002, L0-strf-r005, L0-wind-r006, L0-wind-r012]`

**Source:** §4.6, §2, §9 ("рельеф очень неровный"), test 23.

`wind` does not run its own loop. It registers `WindmillDef` (`L0-wind-e001`) with `chance = 0.01`, `dimension = overworld`, profiles `[dryLand, flat]`, and `strf` drives the flow:

1. **Discovery** (`L0-strf-p001`) reaches an unevaluated Overworld chunk. Windmill is first in the Overworld priority order (`L0-strf-r002` §4).
2. **Roll.** `hash(salt, "o", cx, cz, "windmill") < 0.01`. Fail → nothing, chunk marked evaluated.
3. **Origin + rotation.** Seeded. The ~35×35 plot is anchored to the chunk (origin = chunk min corner + seeded offset such that the plot centre lies inside the chunk). Rotation seeded 0/90/180/270 (`L0-strf-r004`).
4. **Loaded check** (`L0-strf-r007`). The plot spans ~3×3 chunks; if any is unloaded → `pending`, same origin/rotation retried later.
5. **Validate** (`L0-strf-p002`, `-r005`):
   - `dryLand`: liquid surface share ≤ 5 % over the whole rotated plot, no ocean/river ice.
   - `flat`: `max − min` of the first non-leaf, non-log solid surface ≤ 3 over the 35×35 plot.
   - Collision (`L0-strf-r006`): registry instances, spawners, vanilla-structure signatures.
   - Height: base Y + 30 (+ rotor) below the build limit (`L0-strf-r003`).
6. **Invalid → cancel.** No neighbour relocation, no terraforming (`L0-wind-r006`). Reason counted (`uneven`, `liquid`, `collision:*`).
7. **Valid → place** (`L0-strf-p003`). Base Y = the plot's modal surface Y (assumption `L0-wind-as12`). The template includes its own foundation layer, so small (≤ 3) height differences are absorbed by the template skirt, not by script terraforming.
8. **Init** (`L0-wind-p004`): chests → guards → linked-Airship trigger.

## Edge cases
- Spawn Windmill already occupies part of the plot → collision → cancel (the spawn instance is in the registry before discovery starts, `L0-wind-r013`).
- Two 1 % hits in adjacent chunks → the later one collides and is cancelled; no dedupe beyond physical overlap.
- A chunk explored before install becomes eligible (secondary scenario, `L0-adr-strc` §6).
