---
type: "concept-architecture-decision"
node_id: "L0-orbc-ad02"
source_channel: "rollout"
analysis_version: 5
title: "ADR-orbc-02 · Charges are teleported by one shared run-while-live interval with a cell sweep"
aliases: ["L0-orbc-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1942
tags: ["is_a:architecture-decision", "status:proposed", "relates_to:L0-adr-ochg", "relates_to:L0-orbc-p002", "C-5a"]
level: 2
---
# ADR-orbc-02 · Charges are teleported by one shared run-while-live interval with a cell sweep

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-adr-ochg", "L0-orbc-p002", "L0-orbc-as02"]`

**Status:** proposed. It refines `L0-adr-ochg` §1–2.

**Context.**
- A charge must pass through entities, never skip a block, and not be pushed.
- RMB can put 201 charges per attack in flight, with several attacks at once (C-5a′).
- `L0-adr-ochg` says "one bounded job per attack".

**Decision.**
1. **One module-level `system.runInterval(step, 1)`.** It starts when the first attack registers and is cleared when the last attack empties. It advances every live charge by `FALL_SPEED` per tick. Detonation callbacks that need heavy work (the `pntr` column) schedule their own `runJob`.
   - This is a single loop, not one loop per attack. It bounds the scheduler overhead at N attacks.
   - It still meets C-5a′: it exists only while charges exist.
2. **Motion by `teleport`** with the gravity-free, collision-free entity (`ent3`). It never uses `applyImpulse`, because impulse is physics-driven, entities can deflect it, and it would miss cells at speed.
3. **Contact by a column sweep.** It reads the ≤ `FALL_SPEED`+1 cells between the old and the new Y. The cost is O(charges × speed) block reads per tick: 480 × 2 ≈ 960 `getBlock` calls at the design load.
4. The loop body catches errors per charge, so one bad charge is dropped instead of killing the loop.

**Rejected.**
- *One `runJob` per attack* (literal `ochg` §2): a generator per attack, and ordering between attacks is unclear. It is no better than one interval.
- *Physics falling with `has_gravity` plus a `hit_test` or `on_ground` trigger*: that is entity-stoppable, and the fall speed is not controlled.
- *Precomputing the contact Y at spawn and animating only*: terrain can change mid-flight (another LMB column), which gives a wrong point.
