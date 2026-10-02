---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a13"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a13"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 628
tags: ["is_a:acceptance-criterion", "ufo-ac-13", "channel:bds", "relates_to:L0-magn-rleg", "relates_to:L0-lgnd"]
level: 2
---
**UFO AC-13, call-site half (bds; the rule half is in `lgnd`).**
- **GIVEN** each of the three legendaries placed in the zone:
  - on the ground;
  - in a chest together with an iron stack;
  - in a chest minecart;
  - held by an armour stand wearing iron armour;
  - in the off hand of a player whose main hand is empty;
- **WHEN** the magnet runs its full 60 s,
- **THEN**:
  - no legendary entity or stack moves or changes container;
  - the chest's iron stack is extracted;
  - the chest minecart and the armour stand are not pulled (`L0-magn-aslh`);
  - the player is not pulled;
  - legendary ledger counts are unchanged.
