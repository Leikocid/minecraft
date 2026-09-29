---
type: "concept-process"
node_id: "L0-wind-p004"
source_channel: "rollout"
analysis_version: 2
title: "Process — Windmill first initialisation (hooks on the `strf` state machine)"
aliases: ["L0-wind-p004"]
is_a: ["process"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1590
tags: ["is_a:process", "first-init", "relates_to:L0-strf-p004", "relates_to:L0-loot", "relates_to:L0-wind-r004", "relates_to:L0-wind-r012", "relates_to:L0-airs"]
level: 2
---
# Process — Windmill first initialisation (hooks on the `strf` state machine)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["process"]` · `relates_to: [L0-strf-p004, L0-loot, L0-wind-r004, L0-wind-r012, L0-airs, L0-wind-e001]`

**Source:** §4.3, §4.5, §5.6, §6, §7 ("проверку связанных Дирижаблей выполнять один раз после успешной генерации").

`strf` runs `planned → placed → looted → guarded → done`, persisting each step (`L0-strf-p004`). `wind` only supplies data and hooks:

| Step | `wind` contribution |
|---|---|
| placed → looted | `def.chests`: 25 template-local points, floor-tagged 1/2/3 (5/8/12), all `table: "shared"` (`L0-loot`). Floor does not change quality (§3.3 last bullet). |
| looted → guarded | `def.spawnGuards(ctx)` returns 10 entries `{type:"minecraft:zombie_villager_v2", localPos, spawnEvent:"minecraft:spawn_adult"?}` from fixed field positions; per-def extra = infinite particle-less `fire_resistance` (`L0-wind-r004`, `L0-strf-as04`). |
| guarded → done | `body.linked(ctx)` when `la` is unset: first `la=true`, then `LinkedAirships.start`. The outcome is in `ls` (`L0-wind-r012`). |

## Notes
- Spawners need no step: their mob type is in the template block entity (`L0-strf-r010`).
- Wheat, water, fence and decay are template blocks; nothing is added by script.
- The spawn Windmill (`windmill:spawn`, spawn-search.ts:23) runs the identical hooks. Its ring is loaded by the ring loader after the spawn search released its own areas (see `L0-wind-cx02`).
- Deaths, cures and looting after `done` never touch the record.
