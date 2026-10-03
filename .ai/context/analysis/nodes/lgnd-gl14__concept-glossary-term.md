---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl14"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-gl14"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 717
level: 2
---
---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad13", "L0-lgnd-r016"]
---
**Legendary stack vs. legendary item entity**

- **Legendary stack** (`isLegendaryStack(stack)`): any `ItemStack` whose type is a registered legendary `itemId` or craft token, in any mark state (marked, unmarked or stale). It answers "is this a legendary weapon?", and the magnet uses it to never pull one.
- **Legendary item entity** (`isLegendaryItemEntity(entity)`): a `minecraft:item` entity carrying a **live marked** instance. It answers "is this a protected instance?", and `ring` drop suppression and `protectLegendariesIn` use it.

An unmarked `/give` copy is a legendary stack but not a legendary item entity.
