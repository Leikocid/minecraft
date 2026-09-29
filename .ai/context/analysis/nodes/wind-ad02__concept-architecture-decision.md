---
type: "concept-architecture-decision"
node_id: "L0-wind-ad02"
source_channel: "rollout"
analysis_version: 2
title: "ADR — Forced site preparation is a script-computed plan applied by `setPermutation` in a budgeted job"
aliases: ["L0-wind-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1594
tags: ["is_a:architecture-decision", "site-prep", "status:accepted", "relates_to:L0-wind-p003", "relates_to:L0-strf-p005"]
level: 2
---
# ADR — Forced site preparation is a script-computed plan applied by `setPermutation` in a budgeted job

**Links:** `part_of: ["L0-wind"]` · `is_a: ["architecture-decision"]` · `relates_to: [L0-wind-p003, L0-wind-e004, L0-strf-p005]`
**Status:** accepted as amended. Plan and precheck are in script as decided (`planPrep`/`precheck`). The writes are `dimension.fillBlocks` boxes of ≤ 32 768 cells, after a `containsBlock` check for non-natural blocks (`src/structures/prepare.ts:309-335`, probe Q10); there is no per-block `setPermutation`.

## Context
- §4.7.11–12 need per-column decisions: level to a target Y, blend edges with slope ≤ 1, fill only shallow supporting voids, reuse the local surface block, and never touch a structure/spawner/non-natural block.
- Volume: 35×35 plot + band ≈ 2 000 columns × a few blocks each → typically 10–40 k block writes.
- §7: no heavy per-tick scanning; C-5b: heavy work spread with `system.runJob`.

## Decision
- Compute a `SitePrepPlan` (`L0-wind-e004`) in a job, pre-check the entire write set, then apply it with `block.setPermutation`/`setType` in a second job capped at N writes per tick (default 2 000, tuned by the probe).
- The plan is deterministic from origin/rotation/terrain; its hash is persisted so a crash replays it.

## Rejected alternatives
- **`/fill` commands per layer.** Fast, but cannot express per-column surface reuse, slope blending or the "only shallow voids" rule, and `/fill … replace` cannot skip non-whitelisted blocks per cell. Could be used later as an optimisation for the pure "clear above Y" pass.
- **A template "base" skirt that overwrites terrain.** Produces exactly the square platform with vertical walls that §4.7.11 forbids, and would overwrite non-natural blocks.
- **No prep; lower the template until it fits.** Breaks "Windmill always appears" on rough terrain and leaves floating fields.
