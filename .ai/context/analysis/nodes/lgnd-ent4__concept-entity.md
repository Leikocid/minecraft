---
type: "concept-entity"
node_id: "L0-lgnd-ent4"
source_channel: "rollout"
analysis_version: 2
title: "LegendaryLedger: pending (death), generation, owed (loss)"
aliases: ["L0-lgnd-ent4"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1390
tags: ["entity", "ledger", "void-return", "anti-dup"]
level: 2
---
---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-r008"]
---
# LegendaryLedger: pending (death), generation, owed (loss)

Durable state that makes retention and return idempotent.

| Record | Scope / key | Value | Writer |
|---|---|---|---|
| Pending on death | player DP `andrew:<p>_pending` | JSON **array** of marks. 0.3.0 wrote a single mark object, which is read as `[mark]`. | `L0-lgnd-p002` |
| Generation | world DP `andrew:<p>_gen:<instanceId>` | integer; absent = 0 | `L0-lgnd-p003` only |
| Owed returns | world DP `andrew:<p>_owed` | JSON array of `{ playerId, mark, reason: "void" \| "destroyed" \| "despawn" }` | `L0-lgnd-p003` |

## Semantics
- Pending and owed entries are **tokens**. A grant happens only while a token exists. The token is removed in the same script turn that the stack enters the inventory. If the player already carries that `(id, gen)`, the token is removed without a grant. This is the shipped `carriesInstance` guard, applied per element.
- A generation bump and its owed enqueue happen in one synchronous turn (no `system.run`/`await` between them). A crash leaves both written or neither.
- Nothing ever lowers `gen`. `reset` does not touch `gen`, pending or owed.
- Not a census: no locations are recorded (C-4).
- Size is bounded by the number of instances ever lost (`L0-lgnd-as06`).
