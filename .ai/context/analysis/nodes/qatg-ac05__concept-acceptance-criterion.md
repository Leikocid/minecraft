---
type: "concept-acceptance-criterion"
node_id: "L0-qatg-ac05"
source_channel: "rollout"
title: "AC Q-5 — Web Sword is a standalone-ready module"
aliases: ["L0-qatg-ac05"]
part_of: ["L0-qatg"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-qatg-ent3"]
analysis_version: 2
level: 2
priority: 510
size_chars: 974
tags: ["acceptance-criterion","dod","L0-qatg"]
---

# AC Q-5 — Web Sword is a standalone-ready module

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-ent3"]` · `maps_to: ["§14"]`

**GIVEN** `L0-qatg-ac01` through `L0-qatg-ac04` all satisfied
**WHEN** `L0-qatg-p002` derives the `module_ready` subgate
**THEN** the Web Sword is reported ready to be treated as a completed, independent module
**AND** work may proceed to the next Stage-2 legendary weapon per the project's stage gate.

**Spec basis.** §14: *«После прохождения тестов Web Sword можно считать самостоятельным готовым модулем и переходить к следующему оружию.»*

**How to verify.** Purely derived — no independent evidence beyond the four prior criteria (`L0-qatg-ent3`, evaluation rule).

**Not covered here.** Anything about the *next* weapon's scope — out of bounds per `concept-boundary`'s deferred list.
