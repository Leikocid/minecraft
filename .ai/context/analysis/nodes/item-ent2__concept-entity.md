---
type: "concept-entity"
node_id: "L0-item-ent2"
source_channel: "rollout"
title: "Entity: Web Sword Recipe"
aliases: ["L0-item-ent2"]
part_of: ["L0-item"]
is_a: ["entity"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1305
tags: ["entity","recipe","crafting"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["entity"]` · `relates_to: ["L0-item-ent1", "L0-once"]`

# Entity: Web Sword Recipe

| Attribute | Value |
|---|---|
| Identifier | `andrew:web_sword` (recipe, same id as item per pickaxe precedent) |
| Format | `minecraft:recipe_shaped`, `format_version` matching platform (`1.21.0` per pickaxe precedent) |
| Pattern | Row 1: `" W "` · Row 2: `"WDW"` · Row 3: `" W "` |
| Key `W` | `minecraft:cobweb` |
| Key `D` | `minecraft:diamond_sword` |
| Result | `andrew:web_sword`, count 1 |
| Tags | `["crafting_table"]` |
| Unlock | at least one unlock item (precedent: pickaxe unlocks on its first-tier ingredient — here, plausibly `minecraft:diamond_sword` or `minecraft:cobweb`) |

## Notes

- This entity defines **shape only**. Whether a given craft attempt is *permitted to complete* (one-per-world gate) is `L0-once`'s runtime concern, evaluated at craft-completion time, not encoded in this recipe file.
- Diamond Sword is consumed as an ingredient — the recipe does not special-case *which* Diamond Sword (enchanted or not); the spec is silent on whether an enchanted Diamond Sword may be used. Not flagged as a blocking assumption (low impact, no acceptance test references it), but worth a one-line confirmation if the owner is asked about Q-007 anyway.
