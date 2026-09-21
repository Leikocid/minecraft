---
type: "concept-rule"
node_id: "L0-trap-r003"
source_channel: "rollout"
title: "R-003 — The ray stops at the first solid block; never target through a wall"
aliases: ["L0-trap-r003"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1504
tags: ["rule","raycast","walls","L0-trap"]
---

# R-003 — The ray stops at the first solid block; never target through a wall

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-ac06"]`

**Rule.** When the view ray meets a solid block, resolution ends there. The **actually reachable** point at that block becomes the target. The ability never resolves a target on the far side of an obstruction, even when that far side is within the reach distance.

**Source.** §12: *«Луч упирается в ближайший доступный блок: использовать фактически доступную целевую точку; не атаковать сквозь стены.»*

**Rationale.** Without this, a player standing behind cover could trap an opponent they cannot see or be hit by — a line-of-sight exploit rather than a melee-range ability. The spec phrases it as a positive instruction (*use the reachable point*) and a prohibition (*do not attack through walls*); both halves matter, because "stop at the wall" must not degrade into "fail at the wall".

**Applies to.** `L0-trap-ptgt` step 2. Hitting a wall is **not** a failure path — it is the normal way a target resolves. The cube then forms at the wall, and the wall's own cells are skipped or filled according to R-006, not according to how the target was found.

**Interaction with R-006.** A cube centred on a wall face will have many cells inside solid ordinary stone. Those are replaceable and get filled — that is intended, and is what makes the trap work against someone hugging cover.

**Verified by.** `L0-trap-ac06`.
