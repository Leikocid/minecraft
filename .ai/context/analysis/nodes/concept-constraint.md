---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 2
title: "Global Constraints"
aliases: ["L0"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 3068
tags: ["title:Global Constraints", "alias:L0-constraint", "alias:Constraints", "is_a:constraint", "relates_to:L0", "see_also:fourstructuresspecruencopy", "see_also:constraints", "supersedes:L0-constraint@v1"]
level: 0
---
# Global Constraints

| ID | Constraint | Source |
|---|---|---|
| C-1 | Bedrock Edition only. Target device: iPad (App Store Minecraft). | stage-0 |
| C-2 | Stable `@minecraft/server` only, pinned 2.10.0. `min_engine_version` [1,26,50]. BDS 1.26.51.1. Single source of truth: `scripts/targets.mjs`. No Experiments, including for worldgen. | stage-0, pickaxe spec, structures §7/§15 |
| C-3 | On a dependency/format error, retarget using the exact error text. Never switch to Beta/Preview. When an exact rule is impossible on stable APIs, use the closest stable approximation that keeps the core gameplay, and **record the deviation** in the structures deviation report. | pickaxe spec, structures preamble, §11 |
| C-4 | All custom identifiers under `andrew:`. Every item, message and structure name has `en_US` + `ru_RU`. | constraints.md, web sword §10, structures §8 |
| C-5a | Weapon abilities run server-side. Short-lived tick loops are allowed only while temporary objects exist. | web sword §11, scythe §7 |
| C-5b | *(new, see `L0-xcx4`)* Structure generation does **no** global scans of loaded chunks and no per-tick world scanning. One shared, throttled chunk-discovery pass is allowed (player positions → newly seen chunks, ≤ every 20 ticks). Heavy work (validity probe, placement, init) is budgeted per tick and spread with `system.runJob`. | structures §7 |
| C-6 | Durable state (craft budget, structure registry, init flags, spawn-search result) lives in world dynamic properties, survives restart, and is bounded in size. Concurrent events must not bypass it. | web sword §3/§11, structures §6 |
| C-7 | No duplication via craft, death, reconnect or restart. No orphaned temporary entities. Structures: re-load never creates a second set of chests, loot, spawners, guards, markers or copies. | web sword §14, scythe §7, structures §6/§11 |
| C-8 | Reproducible build from a clean clone with one command. This includes structure templates: they are generated or checked in from repo sources, with no manual editor step. | stage-0 |
| C-9 | Verification split. BDS proves loading, scripts, placement, state and loot statistics. The iPad alone proves rendering, icons, names and the visual identity of structures. | constraints.md |
| C-10 | Before-events never mutate the world synchronously. TS `strict`, no `any`. | constraints.md |
| C-11 | Stage gating: Stage N+1 starts only after Stage N criteria close. Structures form their own stage (after Stage 3). | stage-0 |
| C-12 | Never write into unloaded chunks. A structure is placed only when its whole footprint (plus the validity margin) is loaded. Placement never destroys another detected structure or an existing spawner. | web sword §12, structures §2/§6 |
| C-13 | *(new)* Structure blocks are ordinary world blocks: breakable, never protected, never restored. Chest loot is persisted by the container itself, never regenerated. | structures §2, §6 |
| C-14 | *(new)* Dimension locks: Windmill, Airship, Warden City → Overworld only. Bastion → Nether only. Never in the End. | structures §2 |
