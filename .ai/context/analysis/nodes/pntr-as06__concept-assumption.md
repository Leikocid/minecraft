---
type: "concept-assumption"
node_id: "L0-pntr-as06"
source_channel: "rollout"
analysis_version: 5
title: "AS-pntr-06 · Drops from neighbours outside the column are environmental"
aliases: ["L0-pntr-as06"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 789
tags: ["title:AS-pntr-06 · Drops from neighbours outside the column are environmental", "is_a:assumption", "CAN_ASSUME", "relates_to:L0-pntr-r004", "constraint:C-19"]
level: 2
---
# AS-pntr-06 · Drops from neighbours outside the column are environmental

**Gap.**
- §9's "no drops" covers destroyed blocks.
- Removing the column also breaks attached blocks *outside* it (torches, ladders, signs, rails, door halves, portal blocks), and they pop by vanilla rules.
- C-19 forbids "uncontrolled item entities".

**Assumption (CAN_ASSUME).**
- These neighbour drops are "environmental consequences" (AC-9) and are not suppressed.
- They are bounded: at most one ring of neighbours around the 7×7 column.
- `pntr` guarantees zero drops only for cells inside the column.

**Impact if wrong.** If the client wants a spotless column, add a post-job sweep of new item entities in a 9×9 AABB around the column (skipping legendaries). This is the same helper as in `L0-pntr-as02`.
