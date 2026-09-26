---
type: "concept-entity"
node_id: "L0-lgnd-ent2"
source_channel: "rollout"
analysis_version: 2
title: "LegendaryInstanceMark"
aliases: ["L0-lgnd-ent2"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1523
tags: ["entity", "instance-mark", "anti-dup"]
level: 2
---
---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent4", "L0-lgnd-r005", "L0-lgnd-r006"]
---
# LegendaryInstanceMark

Dynamic properties on an `ItemStack` that make one physical legendary distinguishable from an ordinary (Creative, vanilla `/give`) copy (ADR-016, Q-006). Generalised from `Mark` in `src/websword/rules.ts` / `state.ts`.

| Attribute | Key suffix | Type | Notes |
|---|---|---|---|
| `origin` | `_origin` | `"craft" \| "admin"` | Unchanged. An unmarked stack is an ordinary item and gets no protection. |
| `owner` | `_owner` | player id | Crafter or admin recipient. Informational. **Not** the return target. |
| `ownerName` | `_owner_name` | string? | `origin: craft` only. Used by the broadcast. |
| `id` | `_id` | string | Instance id, `<absTime>-<rand36>` (shipped `makeMark`). Stable across re-issues. |
| `gen` | `_gen` | integer ≥ 0 | **New.** Generation. Absent on 0.3.0 stacks, read as 0. |
| `holder` | `_holder` | player id | **New.** Last player whose inventory contained this stack. Absent means `owner`. |

## Rules
- *Live* iff `mark.gen == ledger.gen(prefix, id)` (`L0-lgnd-ent4`). Only live stacks cast (when marked), are retained or are returned (`L0-lgnd-r005`).
- Stamping always clones and then sets the properties (`markSword` semantics). The input stack is never mutated.
- `holder` is written only from `playerInventoryItemChange` for that stack, never by scanning (C-4).
- `parseMark` must accept 0.3.0 serialisations, which lack `gen` and `holder` (`L0-lgnd-r006`).
