---
type: "concept-rule"
node_id: "L0-qatg-r001"
source_channel: "rollout"
title: "Rule Q-R1 — Every acceptance test has exactly one owner and at least one harness mechanism"
aliases: ["L0-qatg-r001"]
part_of: ["L0-qatg"]
is_a: ["rule"]
relates_to: ["L0-qatg-ent1", "L0-qatg-ent2", "L0-qatg-p001"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1357
tags: ["rule","invariant","matrix","L0-qatg"]
---

# Rule Q-R1 — Every acceptance test has exactly one owner and at least one harness mechanism

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["rule"]` · `relates_to: ["L0-qatg-ent1", "L0-qatg-ent2", "L0-qatg-p001"]` · `spec: ["§13"]`

**Rule.** Each of the twelve §13 tests must appear in the Acceptance Matrix (`L0-qatg-ent2`) with exactly one owning L1 component and at least one concrete harness mechanism producing its evidence. A test with zero owners, more than one owner, or zero harness mechanisms is a gap, not a pass.

**Source.** Decomposition plan: *"`L0-qatg` does not invent criteria... If it finds a §13 test with no owner, that is a gap to report upward, not to absorb."*

**Rationale.** Aggregation without this rule degenerates into either silent gaps (a test nobody actually verifies) or duplicated, drifting criteria (two siblings each half-cover the same test differently). Both defeat the point of a single release gate.

**Scope.** All twelve §13 bullets. Does not apply to the five §14 DoD conditions, which this component owns directly (`L0-qatg-ac01`..`ac06`).

**Testable as.** `L0-qatg-p001` (matrix build), `L0-qatg-ac06`.

**Violation looks like.** A matrix row with an empty owner column, or two components' `concept-acceptance-criterion` artifacts both claiming the same §13 bullet with different pass conditions.
