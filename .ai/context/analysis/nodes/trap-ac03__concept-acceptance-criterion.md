---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac03"
source_channel: "rollout"
title: "AC-03 — Protected cells survive; the rest of the cube still fills"
aliases: ["L0-trap-ac03"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1462
tags: ["acceptance-criterion","gate","spec-13-10","safety","L0-trap"]
---

# AC-03 — Protected cells survive; the rest of the cube still fills

**Source:** §13 — *«Контейнер/bedrock внутри объёма не уничтожается; допустимые соседние клетки заполняются.»* · §6 · **Owner after reduce:** `L0-qatg` · **Rules:** R-005, R-006

**GIVEN** a target whose 27-cell volume contains a **chest holding items**, a **bedrock** block, and at least one ordinary replaceable cell,
**WHEN** the ability activates successfully,
**THEN** the chest block still exists **with its full inventory intact**, the bedrock block still exists, every remaining ordinary cell contains `minecraft:web`, **AND** the cooldown starts — a partial cube is a success (R-005).

**Assert the inventory, not just the block.** A classifier that replaces the chest and re-places an empty one would pass a block-type check. Contents are the thing C-8 actually protects.

**Assert the `reason` codes.** `L0-trap-ecel.reason` must be `block-entity` for the chest cell and `indestructible` for the bedrock cell. Without this the test cannot distinguish "correctly skipped the chest" from "never reached the chest", and it is the whole point of the criterion.

**Extend per Q-013.** When the closed deny-list is confirmed, this criterion gains one case per newly named class. The unresolvable-safety case (`unclassified ⇒ skip`) needs its own case too.

**Surface:** GameTest on Docker BDS. The highest-value test in the component — its failure mode is unrecoverable player data loss.
