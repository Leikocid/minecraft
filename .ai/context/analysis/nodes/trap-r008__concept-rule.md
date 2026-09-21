---
type: "concept-rule"
node_id: "L0-trap-r008"
source_channel: "rollout"
title: "R-008 — Server-authoritative and observer-independent"
aliases: ["L0-trap-r008"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1980
tags: ["rule","multiplayer","determinism","server-authoritative","L0-trap"]
---

# R-008 — Server-authoritative and observer-independent

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-ad15", "L0-trap-ac09", "L0-once"]`

**Rule.** Targeting and placement are computed by server logic from server-read state. No client-supplied coordinate, hit result or target identifier may be trusted, and no computed value may depend on who is observing. Two clients watching the same activation see the same 27 cells resolve identically. Concurrent activations by different players are each handled independently.

**Source.** §9: *«Способность должна вычисляться серверной логикой, чтобы все игроки видели одинаковый результат.»* · §9: *«При одновременной активации несколькими игроками каждый успешный вызов обрабатывается независимо.»* · §11: *«Targeting и размещение 3×3×3 должны выполняться серверно.»* · C-3, C-5.

**Rationale.** Client prediction in a PvP add-on is a desync generator: the victim sees cobweb the attacker does not, or vice versa. The spec forbids it structurally rather than asking for reconciliation.

**Applies to.**
- `L0-trap-ptgt` — inputs restricted to the activating player's server-side position, view vector, dimension and the world.
- `L0-trap-pfil` — verdicts computed once, before any write, and not re-derived during apply (ADR-015); otherwise the result depends on write order.
- Module structure — no shared mutable state between handler invocations (TC-3), which is what makes independent concurrent handling free rather than something to engineer.

**Overlap note.** §9 also covers the concurrent-**craft** race; that half belongs to `L0-once` and is deliberately not duplicated here (decomposition plan: *"Multiplayer determinism is not a child"*).

**Verified by.** `L0-trap-ac09` (§13: *«Два клиента в multiplayer видят одинаковую паутину и одинаковое состояние мира»*). Test surface is Docker BDS, not the single-player world (C-5) — with the two-client caveat of ASM-010 / Q-012.
