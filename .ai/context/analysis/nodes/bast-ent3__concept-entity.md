---
type: "concept-entity"
node_id: "L0-bast-ent3"
source_channel: "rollout"
analysis_version: 2
title: "BastionGuard"
aliases: ["L0-bast-ent3"]
is_a: ["entity"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 776
tags: ["is_a:entity", "guard", "piglin"]
level: 2
---
# BastionGuard

One member of the one-time initial garrison of a `MiniBastionStructure`.

**Attributes:**
- `guard_id` — unique within the parent instance.
- `instance_id` — parent `MiniBastionStructure`.
- `mob_type` — `Piglin` (7-10 per instance) | `Piglin Brute` (exactly 2 per instance). Hoglins never appear here.
- `role` — meaningful mainly for Brutes: `treasure-guard` (exactly one Brute) | `roaming` (the other Brute, at a second fixed position; regular Piglins are ambient/roaming).
- `spawned_once_flag` — true after P-bast-002 runs; the roster is never topped up.
- `is_persistent` — always true: no despawn from distance, chunk unload, or server restart.
- `is_alive` — bool; once false, never respawned and no minimum headcount is maintained.

**Source:** §14.5.
