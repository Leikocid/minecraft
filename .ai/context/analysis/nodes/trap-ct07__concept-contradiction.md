---
type: "concept-contradiction"
node_id: "L0-trap-ct07"
source_channel: "rollout"
title: "CTR-007 — The success predicate straddles the `L0-trap` / `L0-cool` ownership line"
aliases: ["L0-trap-ct07"]
part_of: ["L0-trap"]
is_a: ["contradiction"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2536
tags: ["contradiction","open","scope-overlap","target:L0","L0-trap","resolved"]
closed_at: 2026-09-21
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-trap-ct07
---

# CTR-007 — The success predicate straddles the `L0-trap` / `L0-cool` ownership line

- **Status:** `open` · **Category:** scope overlap · **Target node:** `L0` (the parent decomposition) · **Severity:** Low-Medium

## The disagreement

| Where | Statement |
|---|---|
| `L0` decomposition plan, ownership rule 3 | *«Success is decided by `L0-trap`; the cooldown is consumed by `L0-cool`. … `L0-trap` owns the success predicate; `L0-cool` owns everything after it.»* |
| ADR-006 (consequence) | *«Ordering is forced: validate reach → **check cooldown** → place cells → start cooldown.»* |

The plan draws the boundary at the moment of success: everything before belongs to `L0-trap`, everything after to `L0-cool`. But ADR-006 places a **cooldown check inside** the success predicate — an activation while the timer is running is not a success. So `L0-trap` must **read** state that `L0-cool` owns, *before* the handoff point the plan defines. "Everything after it" and "check cooldown before placing" cannot both describe the same boundary.

## Why it matters

It is an interface question disguised as an ownership question, and left unstated it gets answered twice, differently:

- If `L0-cool` exposes a read-only `isReady(player, abilityKey)` that `L0-trap` calls, the plan's rule needs the word *read* added — clean, and it preserves the ADR-007 ability-key seam.
- If instead `L0-cool` wraps the activation (intercepting the use event first and only calling into `L0-trap` when ready), then `L0-cool` owns the event hook, which contradicts this component owning §5's activation entirely.
- If neither is stated, both children will implement a gate and the sword will check the cooldown twice — harmless until one of them starts it.

The same seam carries §13 test 9, which both components claim a half of (`L0-trap-ac08`).

## Not self-resolved

This analysis has provisionally implemented the **first** option — a non-mutating read from `L0-trap-pact` step 4 — because it keeps the event hook with the component that owns §5 and keeps `L0-cool` free of targeting knowledge. But the decomposition plan is the authority on child boundaries, and amending it is L0's call, not a child's.

## Suggested resolution

L0 amends ownership rule 3 to read: *`L0-cool` exposes a read-only readiness query and owns all mutation of the timer; `L0-trap` calls it as part of the success predicate and never writes cooldown state.* Then state explicitly that §13 test 9 is claimed from both sides so `L0-qatg` does not flag it as a double-claim.
