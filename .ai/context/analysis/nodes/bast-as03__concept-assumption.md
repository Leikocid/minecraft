---
type: "concept-assumption"
node_id: "L0-bast-as03"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-as03"]
is_a: ["assumption"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 686
tags: ["is_a:assumption", "CAN_ASSUME", "idempotency"]
level: 2
---
**ASM-bast-03 — Idempotency is implemented via a stored per-instance flag** `CAN_ASSUME`

The spec requires idempotent initialization but does not name a mechanism. Assume each Mini Bastion instance persists an initialization marker (e.g. a dynamic property or block/entity tag scoped to that instance) that P-bast-002 checks before populating chests/gold/guards.

**Impact if wrong:** Without a reliable per-instance marker, chunk reloads could either duplicate chests/gold/guards (breaking AC-bast-05/06/07 and the persistence contract) or, if the marker logic is inverted, never populate the bastion at all.

**Source:** §14.6 (states the idempotency requirement, not the mechanism).
