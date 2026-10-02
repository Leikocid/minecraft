---
type: "concept-process"
node_id: "L0-sauc-p003"
source_channel: "rollout"
analysis_version: 5
title: "P-sauc-3 · The interceptor seam on `src/orbital/flight.ts` and its lifecycle"
aliases: ["L0-sauc-p003"]
is_a: ["process"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 2221
tags: ["is_a:process", "orbc-seam", "relates_to:L0-adr-ufoi", "relates_to:L0-xcx15", "relates_to:L0-orbc"]
level: 2
---
# P-sauc-3 · The interceptor seam on `src/orbital/flight.ts` and its lifecycle

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["process"]` · `relates_to: ["L0-adr-ufoi", "L0-xcx15", "L0-orbc", "L0-sauc-r001"]`

## The `orbc` change (additive, owned by this task)
- `Outcome` gains `"intercepted"`.
- `registerInterceptor(fn: (attack: Attack, charge: Charge, from: Vector3, to: Vector3, tick: number) => boolean): () => void`, backed by a `Set`.
- In `advance()`:
  1. If `next.kind === "move"` and the set is non-empty, each interceptor sees `from = (x, charge.y, z)` and `to = (x, next.y, z)` before the teleport.
  2. If an interceptor returns `true`, `advance` removes the entity and returns `{outcome: "intercepted"}`. `detonate()` is not called.
  3. A `contact` step also offers the segment `charge.y → cellY + 1` to the interceptors before it detonates. This way a hull just above the ground still wins.
  4. The interceptor sees the `Attack` (the ADR's `ownerId` plus `dimensionId`), so `sauc` can ignore charges outside the Overworld.
- `finish()` notifies `observeChargeEnds` as usual. Existing observers ignore unknown outcomes. Ring and penetrator bookkeeping that counts ends must treat `intercepted` as "no effect", like `voided`.
- An interceptor that throws is logged and treated as `false`. A broken saucer must never break the Cannon.

## Lifecycle in `sauc`
- **Register** at saucer spawn (`p001` step 1).
- **Unregister** at removal: after departure, after the blast (`p002` step 9), on `/andrew:ufo stop`, and on event abort.
- `worldLoad` cleanup has nothing to unregister, because the module state is fresh after a restart.

## Gate
- Before the change, the whole Orbital GameTest set (flight, penetrator, rings, the C-20 scenarios) is green on main.
- After the change, with **no** interceptor registered, the same set is green and unchanged, and a node test asserts that `advance` output is identical with an empty set.
- A new scenario registers a stub interceptor (a plane at y = target + 30) and asserts:
  - the charge ends `intercepted`;
  - no block changed in the column;
  - the cooldown still ran.

  This is the in-test negative control: the same shot with the stub unregistered detonates.
