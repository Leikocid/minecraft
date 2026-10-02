---
type: "concept-entity"
node_id: "L0-lgnd-ent4"
source_channel: "rollout"
analysis_version: 5
title: "LegendaryLedger: pending (death), generation, owed (loss)"
aliases: ["L0-lgnd-ent4"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 1607
tags: ["v3-delta"]
level: 2
---
---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-r008", "L0-lgnd-ad11", "L0-lgnd-cx11", "L0-adr-wpn2"]
---
# LegendaryLedger: pending (death), generation, owed (loss)

Durable state that makes retention and return idempotent.

| Record | Scope / key | Value | As built (2026-09-29) | v3 target |
|---|---|---|---|---|
| Pending on death | player `andrew:<p>_pending` | one serialized mark | same | **One mark per weapon** (`wpn2` cx10 ruling b). Unchanged format. |
| Generation | world `andrew:<p>_gen:<id>` | int, absent = 0 | **missing** | Written only by loss return (`p003`) |
| Owed returns | world `andrew:<p>_owed` | map `ownerId → mark` | map | Map `holderId → [ {mark, reason, holderName} ]`. The key is the **return target** (`holder ?? owner`). A 0.3/v2 single-mark value is read as a one-element list. |

## Semantics
- Pending and owed entries are **tokens**. A grant happens only while a token exists. The token is removed in the same turn as the `addItem`. If the target already carries that `(id, gen)`, the token is dropped without a grant (`carriesInstance`).
- A `gen` bump and its owed append or online grant happen in one synchronous turn.
- Nothing lowers `gen`. `reset` touches neither `gen` nor the owed list.
- A move made by `protectLegendariesIn` (`p008`) is **not** a loss. It writes no ledger entry and bumps no `gen`, because the original stack is moved, not copied.
- No locations are recorded. It is not a census (C-4).
- Size is bounded by lost instances (`as06`). With three weapons, that is three owed keys.
