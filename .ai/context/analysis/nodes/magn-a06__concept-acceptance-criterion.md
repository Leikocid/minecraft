---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a06"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 690
tags: ["is_a:acceptance-criterion", "ufo-ac-6", "channel:bds", "relates_to:L0-magn-rply", "relates_to:L0-magn-rexm"]
level: 2
---
**UFO AC-6 (bds).**
- **GIVEN** player A held 6 blocks below the saucer with an iron_ingot in the main hand,
- **WHEN** A runs `dropSelectedItem()`,
- **THEN**:
  - from the next tick A's y decreases monotonically until landing;
  - the dropped ingot entity becomes an `X` element and reaches a ring slot, beyond 10 already-selected elements (the element count becomes 11).

**Second case.**
- **GIVEN** a player B held the same way,
- **WHEN** B's selected slot is switched to a non-iron slot,
- **THEN** B falls, and is pulled again after switching back during the magnet.

**Negative control.** An ingot dropped by a ground player more than 12 blocks from the hover point is not pulled.
