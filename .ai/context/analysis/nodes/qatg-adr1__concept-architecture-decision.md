---
type: "concept-architecture-decision"
node_id: "L0-qatg-adr1"
source_channel: "rollout"
title: "ADR-Q1 — The Acceptance Matrix references sibling artifacts; it does not restate them"
aliases: ["L0-qatg-adr1"]
part_of: ["L0-qatg"]
is_a: ["architecture-decision"]
relates_to: ["L0-qatg-ent2", "L0-qatg-r001"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1622
tags: ["architecture-decision","matrix","L0-qatg"]
---

# ADR-Q1 — The Acceptance Matrix references sibling artifacts; it does not restate them

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-qatg-ent2", "L0-qatg-r001"]`

**Context.** `L0-qatg` must produce one release-gate view over twelve tests defined by five different siblings. The straightforward approach — copy each AT's GIVEN/WHEN/THEN into a `L0-qatg`-owned AC artifact — would give `L0-qatg` its own, independently-editable copy of each criterion.

**Decision.** The Acceptance Matrix (`L0-qatg-ent2`) stores **references** (artifact ids) to each sibling's own `concept-acceptance-criterion` artifact, plus harness-mapping and status metadata that is genuinely `L0-qatg`'s to own. `L0-qatg` writes acceptance-criterion artifacts only for the five DoD-level conditions that belong to no single sibling (`L0-qatg-ac01`..`ac06`).

**Rejected alternatives.**
- *Duplicate every AT as an `L0-qatg`-owned AC* — violates the decomposition plan's explicit rule (*"does not invent criteria"*) and creates two sources of truth that can silently diverge when a sibling refines its own criterion.
- *Merge all twelve into one giant `L0-qatg` acceptance-criterion artifact* — breaks the ≤2KB-per-AC size guidance immediately and re-couples the six components the decomposition plan deliberately split apart.

**Consequences.** The matrix is only as fresh as its last rebuild (`L0-qatg-p001`); it is a derived view, not a live query, so staleness after a sibling update is possible until the next rebuild. This is accepted as cheaper than the alternatives' drift risk.
