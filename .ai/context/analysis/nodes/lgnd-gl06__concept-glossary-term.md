---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl06"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-gl06"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 407
tags: ["glossary"]
level: 2
---
**Last holder**

The player whose inventory most recently contained a given marked instance. Stored in `andrew:<p>_holder` and updated on `playerInventoryItemChange`.

The last holder is who gets the item back after a Void loss or destruction (Scythe §1, "последнему владельцу"). This is not necessarily the crafter (`owner`). On 0.3.0 stacks the field is absent, and the crafter (`owner`) is used instead.
