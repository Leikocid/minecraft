---
type: "concept-rule"
node_id: "L0-magn-rlim"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rlim"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1028
tags: ["is_a:rule", "selection", "see_also:ufomagnetspecv1ruen-part-2"]
level: 2
---
**Rule (UFO §5, AC-8).** One event pulls at most **10 non-player elements**.

- **An element** is one entity: a ground item stack, a stack extracted from one container slot, a mob, a minecart, or the single item produced by a block (a door counts once).
- **When.** The set is chosen once, at magnet-on. Nothing found later joins it, except exempt drops (`L0-magn-rexm`).
- **Priority** is strict between classes:
  1. iron ground items;
  2. iron container stacks;
  3. mobs and minecarts;
  4. built iron blocks;
  5. ore.

  A lower class is considered only if the higher classes leave free slots.
- **Within a class,** candidates are ordered nearest first by 3-D distance from the event centre (the block under the target at arrival). Ties go by entity id or block position, so the order is deterministic in tests.
- **Players** never count toward the 10 and are never in the set (`L0-magn-rply`).
- **A lost slot is not refilled.** An element that becomes invalid during the hold (picked up, killed) leaves its slot empty.
