---
type: "concept-rule"
node_id: "L0-wind-r011"
source_channel: "rollout"
analysis_version: 5
title: "Rule: the spawn search runs once per world and never repeats after a restart"
aliases: ["L0-wind-r011"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 805
tags: ["is_a:rule", "spawn-windmill", "idempotency", "persistence", "relates_to:L0-wind-e002", "relates_to:L0-strf-r008"]
level: 2
---
# Rule: the spawn search runs once per world and never repeats after a restart

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-e002, L0-strf-r008, L0-wind-p002]`

**Source:** §4.7 item 13, §7 bullet 3, §11 DoD 2, C-6, C-7.

- The search state and outcome live in `andrew:st:spawn` (`L0-wind-e002`).
- A non-terminal status resumes from its cursor; it never restarts from stage 1 in a way that could pick a second site (the chosen origin is persisted before placement; the registry id `windmill:S` is unique).
- A terminal status (`done`, `failed`) is never re-run: not after restarts, not if the Windmill is destroyed by players, not if world spawn moves.
- Existing-world install: the record is absent, so the search runs once, with the same rules (`L0-wind-as10`).
