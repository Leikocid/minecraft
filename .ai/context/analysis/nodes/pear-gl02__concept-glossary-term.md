---
type: "concept-glossary-term"
node_id: "L0-pear-gl02"
source_channel: "rollout"
analysis_version: 11
aliases: ["L0-pear-gl02"]
is_a: ["glossary-term"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 499
tags: ["v11", "pearl-rod", "glossary"]
level: 2
---
**Binding (привязка)**

The record on a Pearl Rod: `{dim, plate cell, plate typeId, owner id, owner life epoch, plate generation}`.
- It is created when the rod's hook comes to rest in a pressure-plate cell.
- It is **honoured** only for the same owner with the same epoch.
- It is **cleared** by a successful teleport or a missing or replaced plate.
- It is **void** (ignored, then overwritten) after the owner's death.

**States:** unbound / bound / honoured (bound + the owner's matching epoch).
