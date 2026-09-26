---
type: "concept-architecture-decision"
node_id: "L0-wind-ad03"
source_channel: "rollout"
analysis_version: 2
title: "ADR — The linked Airship is triggered from the Windmill's `afterInit` hook and recorded in `x.linkedTried`"
aliases: ["L0-wind-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1380
tags: ["is_a:architecture-decision", "linked-airship", "status:proposed", "relates_to:L0-airs", "relates_to:L0-wind-r012", "relates_to:L0-strf-e002"]
level: 2
---
# ADR — The linked Airship is triggered from the Windmill's `afterInit` hook and recorded in `x.linkedTried`

**Links:** `part_of: ["L0-wind"]` · `is_a: ["architecture-decision"]` · `relates_to: [L0-airs, L0-wind-r012, L0-strf-e002, L0-strf-p004]`
**Status:** proposed.

## Context
- §5.6/§7: one linked attempt per Windmill, "once, after successful generation". `strf-e002` already reserves `x.linkedTried` in `InstanceRecord` extras.
- The decomposition plan names `wind → airs` as the only data link between bodies.

## Decision
- `WindmillDef.afterInit` calls `airs.tryLinked({ parentId, centre, plotAABB })` when `x.linkedTried` is unset. `airs` returns `placed | none | deferred`.
- `placed`/`none` → set `x.linkedTried = {o: outcome}` and advance to `done`.
- `deferred` (ring chunks not loaded) → stay in `guarded`; retry when discovery next sees the Windmill's chunk (see `L0-wind-cx02`).
- The Airship's own record uses id `airship:L:<parentId>`, so a replay cannot create a second linked Airship even if `linkedTried` was lost.

## Rejected alternatives
- **A separate "linked queue" owned by `airs`.** Duplicates state; two sources of truth for "attempted".
- **Trigger at `placed` (before loot/guards).** Couples Airship failures to Windmill init; any crash ordering gets harder.
- **`airs` polling for Windmills without a linked Airship.** A scan — forbidden by §7.
