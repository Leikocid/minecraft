---
type: "concept-entity"
node_id: "L0-qatg-ent2"
source_channel: "rollout"
title: "Entity — Acceptance Matrix"
aliases: ["L0-qatg-ent2"]
part_of: ["L0-qatg"]
is_a: ["entity"]
relates_to: ["L0-qatg-ent1", "L0-qatg-ent3", "L0-qatg-p001", "L0-qatg-r001"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2372
tags: ["entity","acceptance-matrix","L0-qatg"]
---

# Entity — Acceptance Matrix

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["entity"]` · `relates_to: ["L0-qatg-ent1", "L0-qatg-ent3", "L0-qatg-p001", "L0-qatg-r001"]`

The rolled-up artifact this component exists to produce: the twelve `L0-qatg-ent1` rows, aggregated into one table with an overall status. Not a new test format — a **reference structure**, pointing at existing sibling `concept-acceptance-criterion` artifacts and existing harness scripts rather than restating their content (`L0-qatg-adr1`).

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `rows` | `AT-1`..`AT-12` | See `L0-qatg-ent1` |
| `generated_at` | timestamp / analysis_version | When the matrix was last rebuilt |
| `unclaimed_count` | integer | §13 tests with zero owners — must be 0 before the matrix is "complete" |
| `duplicate_claim_count` | integer | §13 tests with more than one owner — must be 0 |
| `pending_artifact_count` | integer | Tests with a declared owner but no published AC artifact yet (**0** as of the reduce pass — see snapshot below) |
| `overall_status` | `incomplete` \| `complete-pending-execution` \| `green` \| `blocked` | Matrix-level rollup |

## Lifecycle

```
incomplete --all 12 rows claimed, artifacts exist--> complete-pending-execution
complete-pending-execution --harness runs, all rows green + DoD gate satisfied--> green
(any state) --regression on shipped platform (L0-qatg-r003)--> blocked
```

## Invariants

1. Every row traces to exactly one sibling artifact, **or to two when the row is a declared split-claim**. Split-claim rows are enumerated by L0 (ADR-018): AT-12 (`L0-trap` + `L0-once`, the multiplayer-determinism split), AT-9 (`L0-trap` + `L0-cool`, the success/cooldown seam), and the melee row (`L0-item` damage parity + `L0-trap` no-cobweb-on-swing). Outside that list, two owners is still a defect.
2. The matrix never contains criteria text duplicated from a sibling — only the reference (`L0-qatg-adr1`). If a sibling's criterion changes, the matrix reflects it automatically rather than needing a manual sync.
3. `overall_status` cannot be `green` while `L0-qatg-ent3` (the DoD gate) is unsatisfied, even if all twelve rows individually pass — the DoD adds conditions (no-dup across 4 vectors, no Preview dependency) that no single row carries alone.

## Current snapshot (this analysis)

*Superseded by the reduce-pass snapshot below.* At the time this component was deep-dived the author recorded `pending_artifact_count = 5`, believing `L0-trap` and `L0-cool` had not yet published acceptance criteria.

## Snapshot as corrected at reduce (analysis_version 2)

`unclaimed_count = 0` · `duplicate_claim_count = 0` (three declared split-claim rows, per invariant 1 as amended) · `pending_artifact_count = 0` · `overall_status = complete-pending-execution`.

`L0-trap` published `L0-trap-ac01`…`ac09` and `L0-cool` published `L0-cool-ac01`…`ac05` during the same run, before this component's artifacts were written; the "five pending" figure was stale on arrival rather than a real sequencing gap. Verified by reduce reading those artifacts on disk. The matrix is therefore **complete and awaiting execution**, not incomplete — which moves the remaining risk entirely onto the harness, where `L0-qatg-asm1` (two-client availability) and CTR-010 (four-vector dup reading) already sit.
