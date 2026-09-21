---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp5"
source_channel: "rollout"
aliases: ["L0-once-accp5"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1590
tags: ["acceptance-criterion","concurrency","multiplayer","spec-13-12","C-5","L0-once"]
---

**AC-ONCE-5 — Concurrent crafts by two players yield exactly one sword.**

Maps to §9 (*«Два игрока не должны иметь возможность обойти one-per-world crafting из-за одновременного крафта»*) and §14's two-player requirement. Not an explicit §13 test — derived, and must be added to the matrix.

**GIVEN** a fresh world on a dedicated server with two players in Survival, each holding 4× Cobweb and 1× Diamond Sword, at two separate crafting tables,
**WHEN** both complete the craft in the same tick (or in adjacent ticks),
**THEN** exactly **one** `andrew:web_sword` exists in the world afterwards,
**AND** the flag is set exactly once, naming the winner,
**AND** exactly **one** announcement is broadcast — not two,
**AND** the loser is treated as a blocked craft per AC-ONCE-2.

**Which player wins is not asserted.** Fairness is not a requirement; non-bypassability is.

**Harness — note the C-11 strain.** The reliable form is a GameTest with two simulated players crafting in the same tick, which Stage 1 proved is available (`bds:gametest`). Two genuine clients on the Docker BDS LAN server is the stronger evidence but is blocked on ASM-010 (only one iPad exists). Flag to `L0-qatg`: this criterion is the one most likely to need the simulated-player substitution the owner must approve.

**Review gate, not just a test.** The failure is timing-dependent and may pass by luck. Pair the test with a code review assertion: no `await`, no `system.run`, no deferral between the flag read and the flag write (R-004).

**Owned by:** `L0-once` · **Rules:** R-004 · **Rolls up to:** `L0-qatg`
