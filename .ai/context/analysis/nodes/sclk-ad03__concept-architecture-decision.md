---
type: "concept-architecture-decision"
node_id: "L0-sclk-ad03"
source_channel: "rollout"
analysis_version: 7
title: "AD-sclk-03 · Bolt state lives in an in-memory map, not in entity dynamic properties"
aliases: ["L0-sclk-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 778
tags: ["architecture-decision", "state", "C-23"]
level: 2
---
# AD-sclk-03 · Bolt state lives in an in-memory map, not in entity dynamic properties

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sclk-ent3", "L0-sclk-r001"]`

**Context.** C-26 needs a resolve-once guard per bolt. C-23 says in-flight state is not persisted.

**Decision.** `Map<boltId, BoltRecord>` in script memory. The map is the guard: delete, then act. A bolt with no record (after a reload) is removed with no outcome.

**Rejected.**
- **A `resolved` dynamic property on the bolt.** It persists across a reload, against C-23. It costs a property write per bolt. It would also let a reloaded bolt resolve later with a stale owner.
- **The owner's dynamic properties.** They would mix the three Multishot bolts and break r001.
