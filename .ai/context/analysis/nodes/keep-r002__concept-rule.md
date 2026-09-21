---
type: "concept-rule"
node_id: "L0-keep-r002"
source_channel: "rollout"
title: "Rule K-R2 — Conservation: the sword is in exactly one place, and loss is preferred to duplication"
aliases: ["L0-keep-r002"]
part_of: ["L0-keep"]
is_a: ["rule"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2627
tags: ["rule","invariant","anti-dup","idempotency","critical","L0-keep"]
---

# Rule K-R2 — Conservation: the sword is in exactly one place, and loss is preferred to duplication

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-p001", "L0-keep-p002", "L0-keep-p003", "L0-keep-ent1", "L0-keep-ac02", "L0-keep-ac03", "L0-keep-ac04"]` · `spec: ["§4", "§12", "§14"]` · `governed_by: ["C-7"]`

> The central invariant of this component. Every other rule here serves it.

**Rule.** At all times, a bonded Web Sword is either **(a)** an item in exactly one inventory/container, or **(b)** a `pending` obligation in the Retention Ledger — **never both, and never neither-by-accident**. Every transition between (a) and (b) must be idempotent: replaying the triggering event must not produce a second item.

**Source.** §4 *«Реализация обязана предотвращать появление дополнительной копии при смерти, disconnect/reconnect и рестарте»* · §14 *«Нет известных способов дюпа через крафт, смерть или reconnect»* · C-7, which states this absolutely.

**Rationale.** Retention is implemented as *remove now, re-grant later*. That pair is a dup primitive whenever the two halves can both take effect, or the grant can run twice. Events in a game server are not guaranteed to fire exactly once, and a crash can land anywhere between the halves. Correctness therefore cannot rest on event delivery — it must rest on durable state read and flipped before the item is materialised.

## The ordering corollary

The two failure directions are **not** symmetric, so the crash window must always fail toward loss:

| Transition | Correct order | If interrupted |
|---|---|---|
| Retain (`p001`) | remove item **→ then** write `pending` | Item gone, nothing owed → sword lost |
| Restore (`p002`) | flip to `redeemed` **→ then** grant item | Nothing owed, no item → sword lost |

Reversing either order turns the interruption into a duplicate. A lost sword is an admin `/give` away from being fixed and is *visible* to the player who lost it; a duplicated sword is permanent, silent, and defeats the one-per-world design `L0-once` exists to enforce.

**Corollary — redemption is a claim, not a read.** "Check `pending`, then grant, then mark `redeemed`" is wrong even though it reads naturally. The check and the flip must be one operation, or two concurrent respawn events can both pass the check.

**Testable as.** `L0-keep-ac02` (happy path), `ac03` (reconnect replay), `ac04` (restart replay).

**Violation looks like.** Any sequence of death / disconnect / rejoin / restart, in any order and repeated any number of times, that ends with two `andrew:web_sword` instances where one existed before.
