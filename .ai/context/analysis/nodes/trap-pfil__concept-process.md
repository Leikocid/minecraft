---
type: "concept-process"
node_id: "L0-trap-pfil"
source_channel: "rollout"
title: "Process — Cube Expansion, Per-Cell Safety Filter and Placement"
aliases: ["L0-trap-pfil"]
part_of: ["L0-trap"]
is_a: ["process"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 3314
tags: ["process","placement","safety-filter","cobweb","L0-trap"]
---

# Process — Cube Expansion, Per-Cell Safety Filter and Placement

**Links** — `part_of: ["L0-trap"]` · `is_a: ["process"]` · `relates_to: ["L0-trap-ecub", "L0-trap-ecel", "L0-trap-r005", "L0-trap-r006", "L0-trap-r007", "L0-trap-ad13", "L0-trap-ad15"]` · `see_also: ["webswordspecv1ruen-part-1"]`

Two phases, strictly separated: **plan** (pure reads, no mutation) then **apply** (writes only). ADR-015 forbids interleaving them.

## Phase A — plan

1. **Expand.** Centre cell ±1 on X, Y and Z ⇒ 27 candidate cells, centre included (ASM-008, contested by Q-011).
2. **Classify each cell** against the deny-by-default ladder (ADR-013), cheapest test first, short-circuiting on the first `skip`:
   1. **Not loaded / not readable** ⇒ `skip`. §6: *«Не пытаться создавать паутину вне загруженной/доступной области»*; §12 forbids forcing a write at the edge of the loaded region (R-007).
   2. **Contains an entity** ⇒ `skip`. §6: *«Не удалять и не заменять сущности»*. Note this protects the *block*, not the entity: a mob standing in a cell means the cell is not filled.
   3. **Carries a block entity** (chest, barrel, shulker, hopper, furnace, brewing stand, sign, spawner, …) ⇒ `skip`. §6's named example class (R-006, ASM-007).
   4. **Indestructible / explicitly protected** (bedrock, barrier, command block, end portal frame, …) ⇒ `skip` (R-006, ASM-007).
   5. **Already `minecraft:web`** ⇒ `skip` as a no-op — nothing to write, and it keeps overlapping cubes idempotent.
   6. **Ordinary replaceable block** (air, fluids, grass, plants, soft vanilla blocks) ⇒ `permit`.
   7. **Anything not positively classified** ⇒ `skip`. This is the load-bearing default (C-8, R-006).
3. **Emit** 27 `CellVerdict`s into a `CobwebCube` plan (`L0-trap-ecub`). Phase A performs **no** world mutation, so an exception mid-classification leaves the world untouched.

## Phase B — apply

4. Iterate the plan and set each `permit` cell to `minecraft:web` — real ordinary vanilla cobweb, no custom block, no metadata (R-005).
5. Run to completion inside the same synchronous handler invocation. No `runTimeout`, no chunked write, no async.
6. Do **not** re-classify during apply. The plan is the decision record; re-reading mid-write would make the outcome depend on write order and break determinism (R-008).

## Partial cubes are successes, not failures

§6: *«Если часть куба защищена, пропустить только эти клетки; остальные допустимые клетки всё равно заполнить паутиной.»* §13 test 10 tests exactly this. A cube that places 19 of 27 cells is a full success and consumes the cooldown (R-005). The all-or-nothing reading is wrong.

The **zero**-permitted-cells case is the exception the spec does not settle — see **CTR-008**.

## Cost envelope

≤27 block reads and ≤27 block writes per activation, bounded and one-shot. This is the component's entire runtime cost; there is no background work. Compare against C-4, which prohibits the alternative shape (polling) rather than capping this one.

## What is deliberately absent

No cleanup, no expiry timer, no ownership tag on the placed cobweb. Once written, the cobweb is **ordinary shared world state** interacting with everyone by normal Minecraft rules (§9) and persisting until players clear it (§5). Adding a despawn timer is explicitly out of scope per the L0 boundary.
