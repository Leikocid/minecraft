---
type: "concept-rule"
node_id: "L0-airs-r005"
source_channel: "rollout"
analysis_version: 5
title: "Rule: the Airship has no one-time persistent mobs — the only spawned actor is the vanilla spawner"
aliases: ["L0-airs-r005"]
is_a: ["rule"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 944
tags: ["is_a:rule", "persistence", "mobs", "relates_to:L0-strf-r008", "relates_to:L0-strf-r009", "relates_to:L0-strf-r011", "relates_to:L0-strf-p004"]
level: 2
---
# Rule: the Airship has no one-time persistent mobs — the only spawned actor is the vanilla spawner

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- `airs.def.guards` is absent/undefined. Unlike `wind` (10 field Zombie Villagers) and `bast` (7–10 Piglins + 2 Piglin Brutes), the Airship spawns nothing itself at init time (§5.3, §9; `L0-strf-r009`, `L0-strf-p004`). Its `InstanceRecord` skips the `looted → guarded` step and goes `placed → looted → done`.
- The only mob associated with an Airship instance is whatever the vanilla spawner produces at runtime; those entities are **not** tagged `andrew:guard:<instanceId>` and are not tracked by the registry (`L0-strf-r009` last bullet).
- Persistence is entirely `strf`'s: the registry is the sole source of truth for "already initialised" (`L0-strf-r008`); loot never refreshes and a broken spawner never restores (`L0-strf-r011`, §6, §9). `airs` adds no persistence logic of its own.
