---
type: "concept-entity"
node_id: "L0-trap-etgt"
source_channel: "rollout"
title: "Entity — TargetResolution"
aliases: ["L0-trap-etgt"]
part_of: ["L0-trap"]
is_a: ["entity"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2356
tags: ["entity","targeting","L0-trap"]
---

# Entity — TargetResolution

**Links** — `part_of: ["L0-trap"]` · `is_a: ["entity"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-ecub"]`

The answer produced by target resolution: *where the cube goes, and why*. Transient — it exists for the duration of one handler invocation and is never persisted (TC-3).

## Attributes

| Attribute | Type | Notes |
|---|---|---|
| `outcome` | `resolved` \| `none` | `none` means the activation fails free (R-004) |
| `centre` | block coordinate | The cube's centre cell. Undefined when `outcome = none` |
| `kind` | `entity` \| `block` \| `near-point` | Which of §5's three target forms matched |
| `distance` | number (blocks) | Measured from the player's eye; must be ≤ the reach bound (R-002) |
| `hitEntityId` | id \| null | Present only when `kind = entity`; recorded for diagnostics, never used to mutate the entity |
| `dimension` | dimension ref | The activating player's dimension; all 27 cells resolve inside it |

## Why `kind` and `distance` exist

Neither is needed to place the cube. Both exist so a GameTest can assert **why** a target resolved rather than only that one did — the difference between "the cube appeared" and "the cube appeared for the right reason" is what makes `L0-trap-ac06` (wall blocking) and `L0-trap-ac02` (out of reach) meaningful tests instead of coincidences.

## The three target forms (§5)

*«Целью может быть точка на блоке, игрок/живая сущность или точка непосредственно рядом с владельцем, если она находится в допустимой reach-зоне.»*

All three collapse into one `centre` before the cube is expanded. The mapping from each form to a cell is the component's least-specified area:

- **block point → cell** — ASM-008 / **Q-011**. Whether the cube centres on the hit block itself or on the adjacent air cell at the hit face is unanswered, and §13's loose acceptance test will not distinguish them.
- **entity → cell** — ASM-019. Working assumption: the block cell containing the entity's feet position.
- **near point → cell** — ASM-018. Working assumption: the block cell at the ray's end point when nothing was hit inside reach.

## Invariants

- `outcome = resolved` ⟹ `distance ≤ reachBound` (R-002).
- `outcome = resolved` ⟹ `centre` is in a readable chunk, or the whole cube degenerates and CTR-008 applies.
- Every field is derived from server-read state only (R-008).
