---
type: "concept-architecture-decision"
node_id: "L0-wind-ad03"
source_channel: "rollout"
analysis_version: 2
title: "ADR — The linked Airship is triggered from the Placer's finish step (linked hook) and recorded in `la`/`ls`"
aliases: ["L0-wind-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1380
tags: ["is_a:architecture-decision", "linked-airship", "status:accepted", "relates_to:L0-airs", "relates_to:L0-wind-r012", "relates_to:L0-strf-e002"]
level: 2
---
# ADR — The linked Airship is triggered from the Placer's finish step (linked hook) and recorded in `la`/`ls`

**Links:** `part_of: ["L0-wind"]` · `is_a: ["architecture-decision"]` · `relates_to: [L0-airs, L0-wind-r012, L0-strf-e002, L0-strf-p004]`
**Status:** accepted as built. (Full mechanism detail belongs to CNTR-WIND-CX02-AA, not repeated here.)

## Context
- §5.6/§7: one linked attempt per Windmill, "once, after successful generation". `strf-e002` already reserves `x.linkedTried` in `InstanceRecord` extras.
- The decomposition plan names `wind → airs` as the only data link between bodies.

## Decision
- The Placer's `finish` step calls the body's `linked` hook → `LinkedAirships.start(parent)` after `la=true` is written. The outcome is `ls`.
- The Windmill reaches `done` in the same step, whatever the outcome.
- Ring chunks not loaded → `ls=pending`. Retried every 600 ticks and on restart. The Windmill does not wait in `guarded` (see `L0-wind-cx02`).
- The Airship's own record uses id `airship:linked:<parentId>:<slot>`, so a replay cannot create a second linked Airship even if `la` was lost.

## Rejected alternatives
- **A separate "linked queue" owned by `airs`.** Duplicates state; two sources of truth for "attempted".
- **Trigger at `placed` (before loot/guards).** Couples Airship failures to Windmill init; any crash ordering gets harder.
- **`airs` polling for Windmills without a linked Airship.** A scan — forbidden by §7.
