---
type: "concept-entity"
node_id: "L0-trap-ecub"
source_channel: "rollout"
title: "Entity — CobwebCube (placement plan)"
aliases: ["L0-trap-ecub"]
part_of: ["L0-trap"]
is_a: ["entity"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2263
tags: ["entity","placement","cube","L0-trap"]
---

# Entity — CobwebCube (placement plan)

**Links** — `part_of: ["L0-trap"]` · `is_a: ["entity"]` · `relates_to: ["L0-trap-etgt", "L0-trap-ecel", "L0-trap-pfil", "L0-trap-ad15"]`

The complete decision record for one activation: 27 cells, each with a verdict, computed **before** any block is written (ADR-015). Transient; discarded when the handler returns.

## Attributes

| Attribute | Type | Notes |
|---|---|---|
| `centre` | block coordinate | From `TargetResolution.centre` |
| `cells` | `CellVerdict[27]` | Fixed length. Always 27, including cells that will be skipped |
| `permittedCount` | 0…27 | Derived. Drives the success predicate — see CTR-008 for the `0` case |
| `skipReasons` | count by reason | Derived; diagnostics and GameTest assertions only |

## Geometry

27 cells = `centre` ± 1 on each of X, Y, Z, **including the centre cell itself** (ASM-008). §5 says only *«куб … размером 3×3×3, центрированный на целевой позиции»*.

This is the component's most consequential under-specification. §13's acceptance test — *«приблизительно полный 3×3×3 куб Cobweb вокруг центра»* — is loose enough to pass a cube offset by one on every axis, so **the release gate provides no protection here**. Raised as **Q-011**. The GameTest written by `L0-qatg` must assert the exact 27 coordinates, not an approximate block count, or the gate stays blind.

## Lifecycle

1. Built in `L0-trap-pfil` phase A from pure world reads. Immutable once built.
2. Consumed in phase B: every `permit` cell is set to `minecraft:web`.
3. Discarded. Nothing about the cube is recorded in the world — the placed cobweb carries no marker, no owner and no expiry (R-005).

## Why the plan is materialised instead of placing as it classifies

Three reasons, in order of weight:

1. **Determinism** (R-008) — classify-then-write cannot depend on write order; classify-while-writing can, because cell *n* would observe the cobweb from cell *n-1*.
2. **Atomicity of failure** — an exception during classification leaves the world untouched; an exception during an interleaved loop leaves a half-cube.
3. **Testability** — the plan is exactly the artefact a GameTest asserts against, which is how `L0-trap-ac03` distinguishes "skipped the chest" from "happened not to reach the chest".
