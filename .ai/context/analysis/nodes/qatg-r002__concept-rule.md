---
type: "concept-rule"
node_id: "L0-qatg-r002"
source_channel: "rollout"
title: "Rule Q-R2 — Partial coverage is amber, not green"
aliases: ["L0-qatg-r002"]
part_of: ["L0-qatg"]
is_a: ["rule"]
relates_to: ["L0-qatg-ac02", "L0-qatg-ent3"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1476
tags: ["rule","invariant","dod","multiplayer","L0-qatg"]
---

# Rule Q-R2 — Partial coverage is amber, not green

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ac02", "L0-qatg-ent3"]` · `spec: ["§14", "§9"]`

**Rule.** The Definition-of-Done gate may report PASS only when all twelve §13 tests are green in a single-player world **and** the §14 "минимум в тесте с двумя игроками" requirement has produced evidence for every test where §9's multiplayer-determinism claim applies (AT-12 at minimum). Single-player-only coverage is reported as amber/blocked, never rounded up to green.

**Source.** §14: *«Все acceptance tests выше проходят в одиночном мире и минимум в тесте с двумя игроками.»*

**Rationale.** §14 conjoins the two conditions with "и" (and), not "or". A gate that treats single-player-green as sufficient silently drops the multiplayer half of the Definition of Done — exactly the failure C-5 and C-11 exist to catch.

**Scope.** The DoD gate as a whole; does not require every one of the twelve tests to be individually re-run two-player, only that the tests where multiplayer determinism is claimed (§9, boundary table WS-17) have multiplayer evidence.

**Testable as.** `L0-qatg-ac02`.

**Violation looks like.** A release note that says "all tests pass" backed only by `npm test` and single-player `bds:gametest` runs, with no two-client or two-simulated-player evidence anywhere.
