---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl16"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-gl16"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 552
tags: ["v6", "glossary"]
level: 2
---
**Void holder**

An **entity** with an inventory that the engine removes below the dimension floor with no death event and no spill, so its contents never become item entities. As of 1.4.4, `VOID_HOLDER_TYPES` = `minecraft:chest_minecart` and `minecraft:hopper_minecart` (`recovery.ts:135`). Recovery reads their containers in `beforeEvents.entityRemove`. The armour stand is a Void holder that is **not** covered (`cx14`).

**Not the same as:** `HOLDER_TYPES`, the **block** containers that `protectLegendariesIn` empties before a script removes them.
