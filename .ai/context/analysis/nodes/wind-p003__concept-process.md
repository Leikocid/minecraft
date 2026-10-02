---
type: "concept-process"
node_id: "L0-wind-p003"
source_channel: "rollout"
analysis_version: 5
title: "Process — forced site preparation (spawn Windmill only)"
aliases: ["L0-wind-p003"]
is_a: ["process"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 2378
tags: ["is_a:process", "spawn-windmill", "terraform", "site-prep", "relates_to:L0-wind-r008", "relates_to:L0-wind-r009", "relates_to:L0-wind-r010", "relates_to:L0-wind-e004", "relates_to:L0-wind-ad02"]
level: 2
---
# Process — forced site preparation (spawn Windmill only)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["process"]` · `relates_to: [L0-wind-r008, L0-wind-r009, L0-wind-r010, L0-wind-e004, L0-wind-ad02, L0-wind-p002]`

**Source:** §4.7 items 9–12, §9 edge cases 2–4, §12 bullet 2. Only the spawn Windmill may terraform (`L0-strf-r005`: normal generation never does).

## Steps
1. **Plan** (`L0-wind-e004`). For the chosen origin/rotation compute:
   - target level `Yt` = median surface Y of the 35×35 plot (ignoring leaves/logs);
   - the **plot box** (35×35) and the **blend band** of width `B` around it (`L0-wind-as03`);
   - per column: `cut` (blocks above target), `fill` (air/liquid below target down to the shallow-void limit).
2. **Pre-check the whole prep volume** (plot + band, from the lowest fill Y to `Yt` + 32 + rotor):
   - every block is on the natural whitelist or air (`L0-wind-r008`);
   - no collision signature and no `mob_spawner`/`trial_spawner` (`L0-strf-r006`);
   - all chunks loaded (`L0-strf-r007`).
   Any failure → **abort before writing anything**; `p002` takes the next candidate (§4.7.10, §6).
3. **Persist** `status:"preparing"` with the plan hash, so a crash re-runs the same plan (writes are idempotent: target permutations are fixed).
4. **Clear** the plot above `Yt`: trees, leaves, snow, plants, stone, ores, liquids → air, top-down so no floating leaves or falling sand remain. Water source blocks in the volume → air; adjacent liquids at the edge get a natural block wall so nothing flows in.
5. **Level** the plot top layer to `Yt` with the column's own surface block (grass/dirt/sand/…; fallback `minecraft:grass_block`), subsoil `dirt`.
6. **Fill shallow voids** under the plot only (`L0-wind-r010`): air/liquid within `D` blocks below `Yt`, where a template block would otherwise hang. Deeper cave volume is left untouched.
7. **Smooth edges** in the blend band (`L0-wind-r009`): each band column is lerped from `Yt` toward the natural surface with slope ≤ 1 block per horizontal block, same surface block family. No vertical wall higher than 1 block remains.
8. **Place** the template via `strf.tryPlaceAt` and continue with init.

All writes go through `system.runJob` with a per-tick block cap (`L0-wind-ad02`). The world is never left half-prepared across a restart: the `preparing` record replays the same plan before placement.
