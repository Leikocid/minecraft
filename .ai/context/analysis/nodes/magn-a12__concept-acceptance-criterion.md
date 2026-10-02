---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a12"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a12"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 557
tags: ["is_a:acceptance-criterion", "ufo-ac-12", "channel:bds", "relates_to:L0-magn-adar"]
level: 2
---
**UFO AC-12 (bds).**
- **GIVEN** the following in the zone, with no other iron:
  - an iron golem;
  - an empty minecart;
  - a zombie wearing an iron_helmet (`/replaceitem`);
  - an armour stand wearing iron_leggings;
  - a bare zombie;
  - a zombie holding only an iron_sword;
- **WHEN** the magnet turns on,
- **THEN**:
  - the golem, the minecart, the helmeted zombie and the armour stand reach ring slots;
  - the bare zombie and the sword zombie are never moved toward the saucer;
  - after release, no entity still carries the tag `andrew:ufo_iron`.
