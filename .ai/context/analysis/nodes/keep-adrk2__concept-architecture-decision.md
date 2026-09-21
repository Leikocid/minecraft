---
type: "concept-architecture-decision"
node_id: "L0-keep-adrk2"
source_channel: "rollout"
title: "ADR-K2 — Every interruption window fails toward losing the sword, never toward duplicating it"
aliases: ["L0-keep-adrk2"]
part_of: ["L0-keep"]
is_a: ["architecture-decision"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2797
tags: ["architecture-decision","failure-mode","anti-dup","L0-keep"]
---

# ADR-K2 — Every interruption window fails toward losing the sword, never toward duplicating it

**Links** — `part_of: ["L0-keep"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-keep-r002", "L0-keep-p001", "L0-keep-p002", "L0-keep-cons"]` · `governed_by: ["C-7"]`

**Context.** Retention is *remove now, re-grant later*. Between the halves sit a durable write and a possible crash, disconnect or duplicated event. Whatever ordering is chosen, some interruption window exists; the only question is what it produces. C-7 states the no-dup requirement absolutely, while §4's "return it to the owner" has no comparable absolute phrasing and no acceptance test for the crash case.

**Decision.** Order every operation so that an interruption destroys the sword rather than creating a second one.

| Transition | Order | Interrupted result |
|---|---|---|
| Retain (`p001`) | remove item **→** write `pending` | nothing owed, no item → **lost** |
| Restore (`p002`) | flip `redeemed` **→** grant item | nothing owed, no item → **lost** |

Where true atomicity is available, use it; this ordering is the fallback that makes atomicity non-essential for *safety*.

**Rejected alternatives.**
- *Write the obligation first, then remove the item* — the natural "record intent before acting" pattern, and here it is a dup generator: an interruption leaves the sword on the ground **and** owed back.
- *Grant first, then mark redeemed* — same shape on the restore side; the next respawn grants a second sword.
- *Best-effort compensation / retry after failure* — adds a second path that can itself be interrupted, and cannot be tested exhaustively.
- *Treating loss and duplication as equally bad and optimising for neither* — the failure modes are not symmetric, and refusing to choose means the ordering gets decided by accident at the keyboard.

**Consequence — an accepted, stated trade.** A crash at precisely the wrong moment destroys a one-per-world legendary. This is deliberate:

- A **lost** sword is *visible* to the player who lost it, and an admin `/give` restores the situation (admin copies are explicitly permitted, §4).
- A **duplicated** sword is *silent* and *permanent*: it persists in world state indefinitely, cannot be found afterwards without auditing every inventory and container, and defeats the one-per-world design `L0-once` exists to enforce.

**Consequence — testing.** `L0-keep-ac04` must assert the grant count is **exactly 1**, failing on `2` (dup, C-7 breach) *and* on `0` (destroyed legendary). Both are defects; only one is shippable-with-a-known-issue.

**Operator note.** Because the safe direction is loss, operators should know that `/give` is the sanctioned recovery path, and this should be written down wherever the add-on is documented for server owners.
