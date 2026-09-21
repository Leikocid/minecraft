---
type: "concept-rule"
node_id: "L0-qatg-r003"
source_channel: "rollout"
title: "Rule Q-R3 — Shipped-platform regression blocks the gate unconditionally"
aliases: ["L0-qatg-r003"]
part_of: ["L0-qatg"]
is_a: ["rule"]
relates_to: ["L0-qatg-p002"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1282
tags: ["rule","invariant","regression","L0-qatg"]
---

# Rule Q-R3 — Shipped-platform regression blocks the gate unconditionally

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-p002"]` · `governed_by: ["C-10"]`

**Rule.** If any of the 7 existing `npm test` suites (`autosmelt`, `gametest-pack`, `item`, `manifests`, `pickaxe`, `selftest-pack`, `validate`), `bds:check`, or `bds:gametest` regresses, the Web Sword release gate reports BLOCKED regardless of how many of the twelve Web Sword tests pass.

**Source.** C-10: *"Stages 0 and 1 are shipped at v0.2.1... `andrew:miners_pickaxe`... and the 7 existing test suites must continue to pass."*

**Rationale.** The Web Sword is additive to a shipped product (`L0` overview: *"lands in this codebase, not beside it"*). A gate that only checks new-feature tests would let a Web Sword change silently break the pickaxe — the one outcome C-10 rules out absolutely.

**Scope.** All 7 files under `tests/`, plus the `packs/selftest` and `packs/gametest` suites as they existed at v0.2.1. New suites added for the Web Sword are additive and evaluated separately (`L0-qatg-r001`).

**Testable as.** `L0-qatg-p002`.

**Violation looks like.** A merged Web Sword change accompanied by a green Web Sword AT report and a red or skipped `pickaxe.test.mjs`.
