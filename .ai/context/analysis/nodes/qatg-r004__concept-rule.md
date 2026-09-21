---
type: "concept-rule"
node_id: "L0-qatg-r004"
source_channel: "rollout"
title: "Rule Q-R4 — Beta evidence never becomes a runtime requirement"
aliases: ["L0-qatg-r004"]
part_of: ["L0-qatg"]
is_a: ["rule"]
relates_to: ["L0-qatg-ac04"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1510
tags: ["rule","invariant","preview","stable-api","L0-qatg"]
---

# Rule Q-R4 — Beta evidence never becomes a runtime requirement

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ac04"]` · `governed_by: ["C-1"]`

**Rule.** No row of the Acceptance Matrix may cite a Preview/Experiments-gated capability as the verification mechanism for a **shipped** (`packs/behavior` / `packs/resource`) claim. `bds:gametest`'s Beta `@minecraft/server-gametest` dependency is a dev-only evidence-production tool; the fact that a test *runs* under Beta APIs must never be read as the *product* requiring them.

**Source.** §14: *«Нет обязательной зависимости от Experiments/Preview.»* · C-1.

**Rationale.** `packs/gametest` deliberately lives outside the product and runs against its own throwaway world specifically so this distinction holds (see `src/gametest/main.ts` header comment). The rule exists to stop that separation eroding under gate pressure — e.g., "just enable Beta APIs on the real world to make the two-player test easier."

**Scope.** `packs/behavior`, `packs/resource`, and their manifests only. Does not restrict `packs/gametest`/`packs/selftest` themselves, which are already dev-only by design.

**Testable as.** `L0-qatg-ac04`, `manifests.test.mjs` (existing suite, C-10).

**Violation looks like.** A manifest dependency entry for the Beta module inside `packs/behavior/manifest.json`, or release notes instructing a tester to enable Experiments on their own world to see a Web Sword feature.
