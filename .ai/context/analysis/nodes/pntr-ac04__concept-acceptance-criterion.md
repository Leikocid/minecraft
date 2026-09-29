---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac04"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 690
tags: ["title:AC-8 (bds) · Legendary in a column container survives exactly once", "is_a:acceptance-criterion", "channel:bds", "orbital-ac:8", "orbital-ac:20", "constraint:C-7′", "constraint:C-20", "relates_to:L0-pntr-r005", "relates_to:L0-lgnd"]
level: 2
---
**GIVEN** two players, A (the owner) and B.
- Chest X lies in the column plan and contains a Web Sword crafted by B and ordinary items.
- Chest Y lies in the column of a *second* LMB fired by B in the same tick, and its column overlaps A's column.

**WHEN** both LMBs detonate.

**THEN**:
- the world plus all inventories hold exactly **one** instance of the Web Sword, with the same mark id and generation;
- it lies as an item entity outside every column's footprint, or is delivered by `lgnd`'s rules;
- the ordinary items are gone;
- no second copy appears after a restart.

**AND** if `protectLegendariesIn` is mocked to throw, the container cell is **kept** and still holds the sword.
