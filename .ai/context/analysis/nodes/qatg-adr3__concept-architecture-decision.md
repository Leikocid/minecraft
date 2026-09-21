---
type: "concept-architecture-decision"
node_id: "L0-qatg-adr3"
source_channel: "rollout"
title: "ADR-Q3 — The regression floor reuses npm test / bds:check / bds:gametest unmodified"
aliases: ["L0-qatg-adr3"]
part_of: ["L0-qatg"]
is_a: ["architecture-decision"]
relates_to: ["L0-qatg-r003"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1567
tags: ["architecture-decision","regression","harness","L0-qatg"]
---

# ADR-Q3 — The regression floor reuses npm test / bds:check / bds:gametest unmodified

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-qatg-r003"]` · `governed_by: ["C-10"]`

**Context.** C-10 requires the 7 existing suites plus `bds:check`/`bds:gametest` to keep passing. The Web Sword adds new suites, new selftest assertions and new GameTest scenarios of its own.

**Decision.** Web Sword verification is **additive** to the existing three commands (`npm test`, `bds:check`, `bds:gametest`) — new test files land in `tests/`, new selftest checks land in `src/selftest/main.ts`, new GameTest scenarios land in `src/gametest/main.ts`, all run by the same unmodified commands. No separate `web-sword:test` command is introduced.

**Rejected alternatives.**
- *A dedicated `web-sword:test` script* — makes it possible to run Web Sword checks while silently skipping the pickaxe suite, the exact failure mode `L0-qatg-r003` exists to prevent. A separate command is one accidental `npm run` away from a regression slipping through.
- *Replace `pickaxe.test.mjs` scope with a generalized "all items" suite* — reasonable long-term, but out of this component's scope; refactoring existing shipped-platform tests is a C-10 change, not a Web Sword verification concern, and risks the regression it's meant to guard against.

**Consequences.** Every Web Sword PR runs the full existing suite by default, so `L0-qatg-r003` is enforced structurally (you cannot easily run only the new tests) rather than by policy alone.
