---
type: "concept-component"
node_id: "L0-strf"
source_channel: "rollout"
analysis_version: 2
level: 1
title: "Structure framework (`strf`)"
aliases: ["L0-strf"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 4112
tags: ["is_a:component", "structures", "contract-layer", "relates_to:L0-loot", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-infr", "relates_to:L0-adr-strc", "relates_to:L0-adr-strs", "relates_to:L0-adr-tmpl"]
---
# Structure framework (`strf`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: [L0-loot, L0-wind, L0-airs, L0-wrdn, L0-bast, L0-infr]`

## Responsibility
`strf` is the contract layer for all four structures (Four Structures spec §2, §6, §7, §11, §15). It works the way `lgnd` does for weapons. It owns everything that is the same across structures. The four body components (`wind`, `airs`, `wrdn`, `bast`) supply only a `StructureDef` and optional hooks, and they must not restate these rules:

1. **Registry.** `StructureDef` per structure: id, template, dimension, chance, footprint, validator profile, fixed points, and init hooks (`L0-strf-e001`).
2. **Discovery and roll.** One throttled pass maps player positions to newly seen chunks. A deterministic seeded roll decides per (dim, chunk, structure). Candidates are never relocated (`L0-strf-p001`, `-r001`, `-r002`).
3. **Rotation.** A seeded choice of 0/90/180/270. One transform function is used for the AABB and for every template-local point (`-r004`).
4. **Footprint validity.** Parameterised profiles: dry land, open-water share, lava ocean, flatness, world ceiling, Nether floor, plus an altitude solver for the Airship (`L0-strf-p002`, `-r005`, `-r013`).
5. **Collision.** Cancels on an overlap with registry instances, spawners, or a vanilla-structure signature heuristic (`-r006`).
6. **Loaded-footprint guarantee.** Never writes into unloaded chunks. Revalidates immediately before placing (`-r007`).
7. **Placement.** `world.structureManager.place(templateId, dim, origin, {rotation})` from `.mcstructure` templates built by `infr` (`L0-adr-tmpl`) (`L0-strf-p003`).
8. **Persistent instance registry and idempotent first-init.** A state machine `planned → placed → looted → guarded → done` stored in region-sharded world dynamic properties (`L0-strf-e002`, `-p004`, `-r008`).
9. **One-time persistent mobs.** Spawned by script, tagged and named, with no respawn and no top-up (`-r009`).
10. **Spawner semantics.** Vanilla `mob_spawner` block entities come from the template. No script-side spawner logic unless the probe fails (`-r010`, `L0-strf-d002`).
11. **Deviation report.** A checked-in list of every stable-API approximation (§11 DoD) (`-r012`, `L0-strf-e004`).
12. **Tick budget.** All heavy work runs in `system.runJob` generators with per-tick caps (`L0-strf-p005`). This closes `L0-xcx4`.
13. **Probe plan.** A Stage-1-style spike on BDS 1.26.51.1 that must pass before body components start (`L0-strf-p006`).

## Inputs
- Player positions and dimensions, once per ≥20 ticks.
- `StructureDef[]` registered by body components at startup.
- Templates under `packs/behavior/structures/andrew/*.mcstructure` (from `infr`).
- World dynamic properties: `andrew:st:salt`, `andrew:st:<dim>:<rx>:<rz>`, and `andrew:st:spawnWindmill`, the last owned by `wind` but stored through the `strf` store API.

## Outputs
- Placed structures and `InstanceRecord`s.
- Calls to `L0-loot` (`fillChest(instanceId, chestIndex, tableRef)`) and to body hooks (`afterPlace`, `spawnGuards`).
- An exported API for `wind`/`airs`: `tryPlaceAt(def, origin, rot, opts)` and `searchRing(def, centre, rMin, rMax)`. These are the only permitted relocating placements: the spawn Windmill and the linked Airship.
- Debug log lines prefixed `[Scripting] [andrew] strf:` (compatible with `bds-check`'s WARN filter).

## Not owned
- Loot tables and fill algorithm (`loot`).
- Template geometry (bodies + `infr`).
- Spawn-area search policy and terraforming (`wind`), linked-Airship ring policy (`airs`), surface marker (`wrdn`), gold blocks (`bast`).

## Key dependencies and risks
- **Stable API only** (C-2). Nothing notifies scripts about generated chunks, and structures cannot be queried. That is why generation happens on discovery, not during worldgen (`L0-adr-strc`). The deviation report must record it.
- **Per-pack dynamic properties.** A second pack running `strf` has its own registry and would double-generate structures (`L0-strf-cx01`).
- The collision heuristic is incomplete by nature. That limitation goes in the deviation report.
