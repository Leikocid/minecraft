---
type: "concept-acceptance-criterion"
node_id: "L0-pear-ac02"
source_channel: "rollout"
analysis_version: 11
title: "AC-pear-02 · Every vanilla plate binds; the next use teleports once and clears (§8 bullet 2)"
aliases: ["L0-pear-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1251
tags: ["v11", "pearl-rod", "acceptance", "bds", "ipad", "spec-8.2"]
level: 2
---
# AC-pear-02 · Every vanilla plate binds; the next use teleports once and clears (§8 bullet 2)

**Relates to:** L0-pear-pr02, L0-pear-pr03, L0-xasm41.

**`bds`:** one scenario per typeId from `BlockTypes.getAll()` matching `/pressure_plate$/`. The list is printed in the log; it is expected to be 15 or more, including both weighted plates and polished blackstone.
- GIVEN a sim player with a marked rod, standing 6 blocks from plate X, WHEN they cast so that the hook lands in X's cell, THEN within 60 ticks:
  - the rod's record holds X's dimension, cell, typeId, the player's id and epoch;
  - the hook is gone;
  - the lore reads "bound: overworld x y z".
- WHEN the player walks 50 blocks away and uses the rod, THEN no hook survives the use (`L0-adr-prcn`: none spawns on the cancel branch, it is removed at +0 on the remove branch), and the player stands at X's cell (or a neighbour) with a dimension and location read-back within 0.5. The record is cleared.
- **Negative controls:**
  - a hook resting on a stone block next to X → no binding;
  - a hook landing in water above X's level → no binding;
  - an unmarked vanilla rod cast into X → no binding and no properties written.

**`ipad`:**
- after a bind, the rod returns to the idle pose with no lingering line;
- the arrival feels instant: no fall damage, no suffocation, the sound plays.
