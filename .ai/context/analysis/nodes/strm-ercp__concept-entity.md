---
type: "concept-entity"
node_id: "L0-strm-ercp"
source_channel: "rollout"
analysis_version: 8
title: "Vanilla recipes (adr-sbvr A)"
aliases: ["L0-strm-ercp"]
is_a: ["entity"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1241
tags: ["v8", "vanilla-recipes", "C-31"]
level: 2
---
---
title: "Vanilla output recipes: elytra and totem_of_undying"
is_a: ["entity"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sbvr", "L0-lgnd", "L0-magn"]
governs_files: ["packs/behavior/recipes/elytra.json", "packs/behavior/recipes/totem_of_undying.json"]
---
# Vanilla recipes (adr-sbvr A)

| File | identifier | pattern | key | result | unlock |
|---|---|---|---|---|---|
| `elytra.json` | `andrew:elytra` | `"F F" / "FCF" / "F F"` | F = `minecraft:feather`, C = `minecraft:diamond_chestplate` | `minecraft:elytra` ×1 | feather |
| `totem_of_undying.json` | `andrew:totem_of_undying` | `"GGG" / "GEG" / "GGG"` | G = `minecraft:gold_ingot`, E = `minecraft:emerald` | `minecraft:totem_of_undying` ×1 | gold_ingot |

- `format_version` "1.21.0", `tags: ["crafting_table"]`, like the pack's other recipes.
- **No script observes them.** No token, no gate, no dynamic property, no lore (C-31). The magnet, protection and retention treat both outputs as ordinary items.
- **Every input is consumed.** An enchanted or damaged chestplate is accepted as an input, and its enchantments are lost.
- **Collision.** Neither pattern overlaps a vanilla or pack recipe. The pack's only other 3×3 ring-with-centre shapes are legendary, with different keys.
