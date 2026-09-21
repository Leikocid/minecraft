---
type: "concept-entity"
node_id: "L0-trap-ecel"
source_channel: "rollout"
title: "Entity — CellVerdict"
aliases: ["L0-trap-ecel"]
part_of: ["L0-trap"]
is_a: ["entity"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2189
tags: ["entity","safety-filter","L0-trap"]
---

# Entity — CellVerdict

**Links** — `part_of: ["L0-trap"]` · `is_a: ["entity"]` · `relates_to: ["L0-trap-ecub", "L0-trap-r006", "L0-trap-ad13"]`

One cell's classification result. 27 of these make a `CobwebCube`.

## Attributes

| Attribute | Type | Notes |
|---|---|---|
| `position` | block coordinate | Absolute, in the activating player's dimension |
| `verdict` | `permit` \| `skip` | Binary. There is no "maybe" — uncertainty resolves to `skip` (R-006) |
| `reason` | enum (below) | Why. Always populated, including for `permit` |

## `reason` values

| Value | Meaning | Rung |
|---|---|---|
| `unloaded` | Cell not readable / outside the accessible area | 1 (R-007) |
| `entity-present` | A living entity occupies the cell | 2 (§6) |
| `block-entity` | Container or functional block with contents/data | 3 (§6, ASM-007) |
| `indestructible` | bedrock, barrier, command block, end portal frame, … | 4 (§6, ASM-007) |
| `already-web` | Cell is already `minecraft:web` — no-op skip | 5 |
| `unclassified` | Not positively recognised as ordinary and replaceable | 7 — **the deny-by-default branch** |
| `ordinary` | Positively classified as replaceable ⇒ `permit` | 6 |

Rung numbers match the ladder in `L0-trap-pfil` phase A; classification short-circuits on the first match, so `reason` is always the *cheapest* applicable explanation.

## Why `reason` is retained rather than collapsed to a boolean

Because the two ways this component fails are both silent, and the reason code is the only thing that distinguishes them under test. A cube that places 12 of 27 cells is correct next to a bedrock floor and catastrophic next to a chest wall; `permittedCount` alone cannot tell those apart, `skipReasons` can. `L0-trap-ac03` asserts on `reason`, not on a count.

`unclassified` deserves specific monitoring: a high rate of it means the deny-list is mis-tuned and the weapon is quietly useless, which is the safe direction to fail (TC-5) but still a bug worth seeing.

## Invariant

`verdict = permit` ⟺ `reason = ordinary`. No other reason may produce a write. This is R-006 restated as a type-level constraint, and it is the single line most worth reviewing in the whole component.
