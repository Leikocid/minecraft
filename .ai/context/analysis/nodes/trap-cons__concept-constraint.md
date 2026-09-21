---
type: "concept-constraint"
node_id: "L0-trap-cons"
source_channel: "rollout"
title: "Component Constraints — Active Ability"
aliases: ["L0-trap-cons"]
part_of: ["L0-trap"]
is_a: ["constraint"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2964
tags: ["constraint","nfr","performance","determinism","L0-trap"]
---

# Component Constraints — Active Ability

**Links** — `part_of: ["L0-trap"]` · `is_a: ["constraint"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-2"]`

Component-scoped NFRs. These **refine** C-1…C-12, they do not replace them; C-1…C-12 are inherited unchanged (decomposition plan, reduce pass 4).

## TC-1 — Zero recurring work

The component registers **no** tick handler, no interval, no scheduled callback. All logic hangs off the item-use event. This is stricter than C-4 (which only forbids a *global* per-tick scan) and is adopted deliberately: the add-on's single permitted recurring tick is `L0-cool`'s actionbar writer, and spending it here would leave none.

## TC-2 — Bounded, single-tick execution

One activation performs at most: 1 raycast, 27 block reads, 27 block writes. No unbounded loop, no search, no retry. The whole pipeline completes inside one synchronous handler invocation (ADR-015) — this is also what makes §9's independent concurrent handling free.

## TC-3 — No inter-activation state

The component holds no mutable module-level state between invocations. Every input is re-read from the player or the world. Consequence: N concurrent activations cannot interfere, and a server restart leaves nothing to restore (C-5).

## TC-4 — Observer-independent results

Every computed value must derive from server-read state only. Forbidden inputs: client-supplied coordinates, client-reported hit results, anything keyed to a rendering context (C-3). Test: replaying the same activation from the same player state must yield the same 27 verdicts.

## TC-5 — Deny-by-default is not tunable downward without evidence

The classifier's `unknown ⇒ skip` branch may only be narrowed on **positive evidence** that a block class is safe, never on the grounds that the trap feels weak (C-8, ASM-007). Rationale: destroyed storage is unrecoverable; a weak trap is a tuning bug. Any narrowing lands with its own GameTest.

## TC-6 — No writes outside the loaded region

A cell that cannot be read is not written. No chunk may be force-loaded, ticket-pinned or otherwise coerced to satisfy an activation at the edge of the loaded area (§6, §12, R-007).

## TC-7 — Stable surface only for raycast and block mutation

Raycasting, entity intersection and block get/set must all be available on `@minecraft/server` 2.10.0. If any is Beta-only, **escalate to L0** rather than adopting the Beta channel: per C-1 the mechanic changes, not the channel. A documented degraded fallback (e.g. cube centred on the block directly in front of the player) is preferable to a Preview dependency.

## TC-8 — Silent failure

A failed activation produces no chat message, no sound cue beyond vanilla, and no state change (§5 specifies only *«способность не срабатывает»*). If the owner later asks for feedback on failure, it arrives as a translate key from `L0-item` (C-9, ADR-009) — this component must not introduce a literal string in the meantime.
