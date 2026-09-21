---
type: "concept-architecture-decision"
node_id: "L0-keep-adrk1"
source_channel: "rollout"
title: "ADR-K1 — The retention ledger is the idempotency token, not a side record"
aliases: ["L0-keep-adrk1"]
part_of: ["L0-keep"]
is_a: ["architecture-decision"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2501
tags: ["architecture-decision","ledger","idempotency","L0-keep"]
---

# ADR-K1 — The retention ledger is the idempotency token, not a side record

**Links** — `part_of: ["L0-keep"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-keep-ent1", "L0-keep-p002", "L0-keep-p003", "L0-keep-r002"]` · `refines: ["ADR-008"]` · `governed_by: ["C-5", "C-6", "C-7"]`

**Context.** ADR-008 decided to intercept the drop and restore *"guarded by an idempotency check"* but did not say what the guard is made of. §4 names three independent replay vectors — death, disconnect/reconnect, restart — and C-7 forbids all of them absolutely. Game-server events carry no exactly-once guarantee, and a crash can land between the withhold and the re-grant.

**Decision.** Make the ledger entry **itself** the idempotency token. Redemption is a **claim**: the state flip `pending → redeemed` and the item grant are one operation, and no grant is possible without a `pending` entry to consume. The respawn path (`L0-keep-p002`) and the join path (`L0-keep-p003`) are two triggers for **one** redemption, not two granting mechanisms.

**Rejected alternatives.**
- *Check-then-grant-then-mark* — reads naturally and is wrong: two concurrent respawn events both pass the check before either marks. The check and the flip must not be separable.
- *A separate "already restored" boolean alongside the ledger* — two pieces of state that can disagree; the disagreement is a dup.
- *Deduplicating on event identity (event id / timestamp window)* — does not survive restart, and the restart case is an explicit §4 requirement.
- *Respawn-time "give if missing"* — already rejected in ADR-008; it cannot distinguish "died and lost it" from "an admin took it" or "legitimately holding an admin copy".
- *Reconstructing state at boot by scanning* — violates C-4 and was rejected for the analogous craft flag in ADR-005.

**Consequences.**
- Restart safety becomes a **property of the storage choice** (durable world-scoped state, C-6) rather than of recovery code. There is no startup sweep and no cleanup job (`L0-keep-r005`).
- The number of grants is bounded by the number of **deaths**, not by the number of sessions — which is exactly what C-7 asks for, and is what `L0-keep-ac03` tests by cycling N times.
- Ledger keys are per-player and disjoint, so concurrent deaths and respawns never interact (C-5).
- A stranded `pending` entry costs one map key and represents an item that does not exist. Harmless, and deliberately not garbage-collected — expiry would risk granting against stale state.
