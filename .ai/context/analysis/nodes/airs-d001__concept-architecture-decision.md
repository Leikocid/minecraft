---
type: "concept-architecture-decision"
node_id: "L0-airs-d001"
source_channel: "rollout"
analysis_version: 5
title: "ADR-airs-01 — The \"not above the Windmill\" exclusion is a cheap 2D AABB pre-filter on `airs`'s own footprint, using the parent's stored footprint"
aliases: ["L0-airs-d001"]
is_a: ["architecture-decision"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 2440
tags: ["is_a:architecture-decision", "status:accepted", "collision", "linked-search", "relates_to:L0-strf-d004", "relates_to:L0-wind"]
level: 2
---
# ADR-airs-01 — The "not above the Windmill" exclusion is a cheap 2D AABB pre-filter on `airs`'s own footprint, using the parent's stored footprint

**Status:** accepted as built: `overParent` 2D pre-filter through `overlaps2d` (`bodies/airship.ts:41-42,169`; `search-ring.ts:80`).

## Context
- §5.6 requires the linked Airship to never hang directly over the Windmill or its fields, but independent Airships are explicitly allowed to (`L0-strf-d004` consequences).
- `strf`'s generic collision test is a 3D AABB with a 2-block margin (`L0-strf-r006`, `-d004`) — it does *not* reject a candidate floating 40+ blocks above the Windmill's footprint, since the AABBs do not overlap vertically. A dedicated 2D check is needed, and `L0-strf-d004` explicitly assigns it to `airs`'s ring search rather than folding it into the generic check.

## Decision
- Store the parent Windmill's rotated footprint AABB (X/Z extent only, from its own `InstanceRecord`) and pass it into `tryLinked` as `excludeAABB` (`L0-airs-e002`).
- Before running the expensive footprint/altitude probe on a ring candidate, test the candidate's own rotated X/Z footprint against `excludeAABB` with simple 2D rectangle overlap. A hit skips the candidate outright — no probe, no collision pass.
- This runs only inside `airs.tryLinked`. Independent-Airship generation and `strf`'s generic collision test are untouched, so an independent Airship may still legally float over a Windmill (`L0-strf-d004`).

## Rejected alternatives
- **Fold it into `strf`'s generic 3D collision test as a special case keyed on `def.id === "airship"`.** Rejected: it would special-case a generic component for one body's rule, and would risk being applied to independent generation too, contradicting `L0-strf-d004`'s explicit "allowed for independent" consequence.
- **Exclude only the single column above the Windmill's centre point.** Rejected: too narrow — it would still let a linked Airship hover over the wheat fields a few blocks off-centre, which §5.6 explicitly forbids ("Мельницы/полей", not just the building).
- **Re-use the 3D AABB test with the Windmill's Y-range stretched to the full height range.** Rejected: equivalent in effect to the chosen 2D test but more expensive (a full-height AABB overlap scan vs. a flat rectangle test) for no extra correctness.

## Consequences
- The exclusion is a pure `airs`-side pre-filter; `strf` needs no new parameter on its collision API. If `wind`'s footprint shape ever changes, only `airs`'s call site needs the new AABB, not `strf`.
