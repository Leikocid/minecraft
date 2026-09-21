---
type: "concept-acceptance-criterion"
node_id: "L0-qatg-ac06"
source_channel: "rollout"
title: "AC Q-6 — The Acceptance Matrix itself has no unclaimed or duplicate rows"
aliases: ["L0-qatg-ac06"]
part_of: ["L0-qatg"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-qatg-p001", "L0-qatg-r001"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1008
tags: ["acceptance-criterion","matrix","meta","L0-qatg"]
---

# AC Q-6 — The Acceptance Matrix itself has no unclaimed or duplicate rows

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-p001", "L0-qatg-r001"]` · `maps_to: ["§13"]`

**GIVEN** the current state of all five siblings' `concept-acceptance-criterion` artifacts
**WHEN** `L0-qatg-p001` rebuilds the Acceptance Matrix
**THEN** `unclaimed_count = 0` and `duplicate_claim_count = 0` for all twelve §13 rows
**AND** any nonzero `pending_artifact_count` is reported as a named gap (which sibling, which row) rather than silently blocking the whole gate with no explanation.

**Spec basis.** Decomposition plan reduce pass #2 (*"the five feature children... funnel into `L0-qatg`... reports any test left unclaimed or claimed twice"*).

**How to verify.** `L0-qatg-p001`, re-run whenever a sibling publishes.

**Not covered here.** The individual correctness of any sibling's own AC — this criterion only checks that the aggregation is structurally sound.
