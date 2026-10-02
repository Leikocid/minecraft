---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a09"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 688
tags: ["is_a:acceptance-criterion", "ufo-ac-9", "channel:bds", "relates_to:L0-magn-rcnt", "relates_to:L0-magn-adhp"]
level: 2
---
**UFO AC-9 (bds).**
- **GIVEN** these containers, each holding 1 iron stack in slot 0 and 3 dirt in its last slot:
  - chest, double chest (iron in its second half), trapped chest, barrel, hopper;
  - furnace, blast furnace, smoker;
  - dispenser, dropper, brewing stand;
  - undyed shulker box;

  Across several runs at ≤ 10 per event, every type is covered.
- **WHEN** the magnet turns on,
- **THEN**:
  - each iron stack becomes an item element with the same id and amount;
  - the slot is empty;
  - the dirt is unchanged;
  - every container block, the hopper included, is still in place;
  - the double chest yields its stack exactly once;
  - a crafter holding iron is untouched.
