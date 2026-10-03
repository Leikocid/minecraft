---
type: "concept-architecture-decision"
node_id: "L0-ring-ad02"
source_channel: "rollout"
analysis_version: 5
title: "AD-ring-02 · A global FIFO detonation queue with a per-tick cap"
aliases: ["L0-ring-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1604
tags: ["is_a:architecture-decision", "performance", "status:proposed", "relates_to:L0-ring-p003", "relates_to:L0-ring-cons", "relates_to:L0-orbc-r014", "relates_to:L0-ring-as05"]
level: 2
---
# AD-ring-02 · A global FIFO detonation queue with a per-tick cap

**Status:** proposed.

**Context.**
- `orbc` calls `onDetonate` at contact, and on flat ground all 201 charges of an attack touch down in the same tick.
- C-5a′ requires the budget to hold for "201 charges per player, several players at once". Real load: 3 × 201 = 603 explosions in one tick (63 at power 4, 120 at 2, 420 at 1).
- `L0-orbc-r014` asks effects to keep `onDetonate` synchronous-safe and to move heavy work into their own bounded job.

**Decision.**
- `onDetonate` enqueues.
- A single module-level interval drains ≤ 48 blasts per tick, FIFO across all attacks.
- It drains once immediately in the enqueue tick, and clears itself when the queue is empty (`p003`).

**Rejected.**
- **Explode inline in `onDetonate`:** it gives an unbounded spike, up to 480 explosions in one tick.
- **Stagger spawn heights or fall speeds per ring** to spread contacts: it violates "spawned and fall simultaneously" (§10), and it forks the charge contract, which is forbidden by the L0 reduce plan.
- **A `runJob` generator per attack:** its per-tick share is not deterministic (the job scheduler decides), so RG-2 cannot be asserted in a gametest. It also gives no cross-attack fairness.
- **Merging nearby blasts into fewer, larger explosions:** it breaks AC-12 ("each own explosion, own sound") and the TNT crater shape.

**Consequences.**
- The latency is ≤ 0.2 s per attack and ≤ 0.5 s for three.
- A charge vanishes at contact while its blast may follow up to a few ticks later. That is not noticeable at 0.05 s per tick, and it is documented (C-16).
