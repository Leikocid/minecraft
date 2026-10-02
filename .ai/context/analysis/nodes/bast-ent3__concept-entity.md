---
type: "concept-entity"
node_id: "L0-bast-ent3"
source_channel: "rollout"
analysis_version: 5
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
- registry `guarded`, never reset (`L0-strf-r009` §3).
- `is_persistent`, `is_alive` — governed by `L0-strf-r009`.

**Source:** §14.5.
