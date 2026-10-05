---
type: "concept-contradiction"
node_id: "L0-lgnd-cx13"
source_channel: "rollout"
analysis_version: 7
title: "CX-lgnd-13 · UFO \\"a pulled block becomes air and exactly one item, nothing else drops\\" vs a hopper block's contents"
aliases: ["L0-lgnd-cx13"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 1579
tags: ["ufo","magn","resolved"]
level: 2
closed_at: 2026-10-02
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-lgnd-cx13
---

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-magn", "L0-lgnd-r016", "L0-lgnd-r013", "L0-lgnd-ad13", "L0-lgnd-as12", "ufomagnetspecv1ruen-part-2"]
status: resolved
resolved_by: ["decision-resolve-l0-lgnd-cx13"]
category: source-vs-invariant
---
# CX-lgnd-13 · UFO "a pulled block becomes air and exactly one item, nothing else drops" vs a hopper block's contents

**Source.**
- UFO §4 lists `hopper` among the iron **blocks**.
- §5 Blocks, and AC 10: *«Выбранный блок заменяется воздухом, а на его месте появляется его предмет … лишнего дропа нет»*.

**Invariant.**
- A hopper is in `HOLDER_TYPES`.
- `setType(air)` erases a container's contents with no spill (`as12` item 3, `CNTR-XCX10-AA` F2).
- A legendary in that hopper would vanish with no return, which violates R-lgnd-012/013 and UFO AC 13.
- The hopper's other (non-iron) contents would vanish too, which breaks Agent priority (1) "no world corruption".

**What `lgnd` requires** (`r016` item 4): `protectLegendariesIn` on the cell before `setType`. The legendary drops beside the cell, which is an "extra drop" against AC 10's "nothing else drops".

**Resolution needed** (owned by `magn` / L0). Choose one:
- (a) Protect the legendaries and accept that one extra drop for them.
- (b) Never select a hopper block that holds anything. The candidate is skipped, and AC 10 holds literally.
- (c) Spill all contents first.

`lgnd`'s floor is (a) or (b); erase-blind is not acceptable. The recommended default is (b): it keeps AC 10 literal, and it touches no container contents (UFO §5 Containers: *«остальное содержимое и сам контейнер не трогаются»*).

Resolved by `decision-resolve-l0-lgnd-cx13` (spec `2441fb5`): option (b). A hopper holding anything is never a pulled block, and an empty one is. AC 10 holds literally and r016 §4 is dormant.
