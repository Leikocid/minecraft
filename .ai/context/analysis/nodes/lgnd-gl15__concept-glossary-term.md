---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl15"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-gl15"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 871
level: 2
---
---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p008", "L0-lgnd-as15", "L0-lgnd-cx13"]
---
**Holder block vs. entity holder**

- **Holder block**: a block type in `HOLDER_TYPES` (`recovery.ts:491`) that can contain a legendary as a stack: chests, barrels, hoppers, droppers, dispensers, the crafter, furnaces, shulker boxes, copper chests, shelves, decorated pots and item frames. `protectLegendariesIn` and the departure search read only these. Writing over one (`setType`, `fillBlocks`, a structure place) erases its contents, so script writers protect first.
- **Entity holder**: an entity that carries stacks: a chest or hopper minecart, an armour stand or a mob hand. Recovery never reads it. Its contents become watchable only when the entity is destroyed and spills them. The UFO magnet must not select one that carries a legendary (`r016`).
