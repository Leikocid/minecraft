---
type: "concept-rule"
node_id: "L0-wind-r004"
source_channel: "rollout"
analysis_version: 5
title: "Rule: exactly 10 field Zombie Villagers, once, persistent until death, sun-immune"
aliases: ["L0-wind-r004"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1253
tags: ["is_a:rule", "guards", "mobs", "persistence", "relates_to:L0-strf-r009", "relates_to:L0-wind-e003", "relates_to:L0-wind-as08", "relates_to:L0-wind-as09"]
level: 2
---
# Rule: exactly 10 field Zombie Villagers, once, persistent until death, sun-immune

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-r009, L0-strf-p004, L0-wind-e003, L0-wind-as08, L0-wind-as09]`

**Source:** §4.5, §6 bullet 2, §9 edge case 8, test 19.

Windmill-specific values on top of the generic guard rule (`L0-strf-r009`):
1. **Count:** exactly 10 per Windmill instance, spawn Windmill included; one per fixed `guardPoint` around the wheat fields.
2. **Once:** only during `looted → guarded`. The persisted state past `guarded` is the "initial guards spawned" flag; deaths never reset it.
3. **Persistent:** no despawn from distance, chunk unload or restart (name tag).
4. **Sun-immune:** permanent `fire_resistance` (no particles). They must not ignite or take fire damage in daylight.
5. **Free:** they wander and may leave through fence gaps; nothing leashes or returns them. The fence must not trap them (≥ 3 gaps).
6. **No top-up:** killing k of them leaves 10 − k forever, across restarts.
7. **Independent from the F1 spawner:** spawner Zombie Villagers are never counted, tagged or protected.
8. **Difficulty:** if the world is Peaceful when the step runs, the step is deferred, not skipped (`L0-wind-as08`).
