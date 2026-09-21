---
type: "concept-architecture-decision"
node_id: "L0-once"
source_channel: "rollout"
title: "Architecture Decisions — One-per-World Craft Gate"
aliases: ["L0-once"]
part_of: ["L0-once"]
is_a: ["architecture-decision"]
relates_to: ["L0-once"]
analysis_version: 2
level: 1
priority: 510
size_chars: 4558
tags: ["adr","architecture-decision","web-sword","L0-once"]
---

# Architecture Decisions — One-per-World Craft Gate

**Links** — `part_of: ["L0-once"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0", "L0-keep", "L0-item"]`

**Inherited and binding:** **ADR-005** (one-per-world state lives in world-level dynamic properties), **ADR-009** (all user-facing text is a translate key), **ADR-010** (ships inside the existing `andrew` packs). This node does not revisit them. Two further decisions are forced at component depth.

---

## ADR-011 — The enforcement point is craft completion, with a synchronous read-check-write claim

**Context.** §3 requires the second survival craft to be *«заблокирован без потери ингредиентов, насколько это позволяет стабильный API»*, and §9 requires that two simultaneous crafts cannot bypass the gate. C-1 forbids Beta APIs; C-5 makes dedicated-server concurrency a first-class concern. ASM-011 anticipates that the stable surface offers no pre-craft veto.

**Decision.** Hook the **craft-completion** event server-side. Inside a single synchronous handler invocation, in this order: confirm the craft produced a result → read the crafting player's game mode → read the world craft flag → if unset, write it → then announce. If set, remove the result and attempt the ingredient refund. **No `await`, no `system.run`, no queued callback may appear between the flag read and the flag write** — that uninterrupted window *is* the atomic claim (ASM-015).

**Rejected alternatives.**
- *Pre-craft veto / recipe-unlock gating* — preferred if it exists on the stable surface (ASM-011's "good direction": simpler, no refund edge cases). Rejected as the **planned** design only because the analysis cannot confirm it exists. If implementation finds it, revisit this ADR rather than working around it.
- *Deferring the flag write to a follow-up tick* (`system.run`) — the single most likely way to introduce the §9 race. It passes every single-player test and fails only under real concurrency.
- *A per-player "has crafted" record* — fails §3 outright: a second player would get their own sword. Also fails AC-ONCE-2's cross-player half.
- *A lock/mutex around the craft* — no such primitive exists on the stable surface, and the single-threaded handler model makes it unnecessary if the ordering rule is obeyed.
- *Announcing before the flag write* — a throw between the two announces a craft that was never recorded, silently re-opening the budget.

**Consequence.** The ordering is a **reviewable rule**, not just a runtime behaviour: a code reviewer can verify race safety by reading for asynchrony between read and write. That matters because AC-ONCE-5 is timing-dependent and can pass by luck. The review gate is recorded in R-004 and in AC-ONCE-5's "review gate, not just a test" clause.

---

## ADR-012 — The flag stores a versioned record, not a bare boolean

**Context.** ADR-005 fixed the *storage mechanism* (world dynamic property) but not the *payload*. §3 requires the announcement to name the creator; §13 requires the block to persist across restart; G-4 will add more legendary weapons, each presumably with its own gate.

**Decision.** Store a single serialized JSON record under `andrew:web_sword_craft_gate` carrying `{ v, crafted, crafterName, crafterId, at }` (entity `L0-once-ecft`). One property, written atomically as one value.

**Rejected alternatives.**
- *A bare boolean property* — cannot name the crafter in the blocked-craft denial message, and offers no migration path when the cross-weapon framework arrives. The information is free to store and impossible to recover later.
- *Several independent properties* (`…_crafted`, `…_crafter`, `…_at`) — a torn multi-write can leave `crafted: true` with no crafter name, producing a broken announcement and an unattributable gate. A single serialized value makes the write all-or-nothing.
- *Recording the crafted item instance in the record* — deliberately rejected. It would pull CTR-005's provenance question into this component, which owns the craft flag and explicitly **not** the item ledger. If the owner grants a provenance marker, it belongs to `L0-keep`.
- *`crafterName` alone, without `crafterId`* — a display name is mutable; the id is not. The denial message must still attribute the craft years later.

**Consequence.** `v` is the migration seam: when weapon #2 lands and a shared gate registry becomes worthwhile, existing worlds can be read forward without re-opening any budget. This is the same "ship single-item, keep the seam" posture ADR-007 takes for cooldown, applied to persistence.
