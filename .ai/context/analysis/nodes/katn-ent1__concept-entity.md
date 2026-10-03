---
type: "concept-entity"
node_id: "L0-katn-ent1"
source_channel: "rollout"
analysis_version: 6
title: "E-katn-1: The Dragon Katana item"
aliases: ["L0-katn-ent1"]
is_a: ["entity"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 2372
tags: ["entity", "katana", "item", "is_a:entity", "relates_to:L0-lgnd-ent1", "relates_to:L0-webs-ent1"]
level: 2
---
---
title: "E-katn-1: The Dragon Katana item and its LegendaryDef"
is_a: ["entity"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd", "L0-lgnd-ent1", "L0-webs-ent1", "L0-katn-r001", "L0-xasm22"]
see_also: ["dragonkatanaspecv1ruen-part-1"]
---
# E-katn-1: The Dragon Katana item

**Item JSON** (`packs/behavior/items/dragon_katana.json`). It is a copy of `web_sword.json` with these changes:

| Field | Value |
|---|---|
| `identifier` | `andrew:dragon_katana` |
| `menu_category` | `equipment`, group `minecraft:itemGroup.name.sword` |
| `display_name` | `item.andrew:dragon_katana.name`: EN "Dragon Katana", RU "Катана дракона" |
| `icon` | `andrew_dragon_katana` (new RP texture) |
| `max_stack_size` | 1 |
| `hand_equipped` | true |
| `allow_off_hand` | true (needed for the off-hand slot, even for scripts) |
| `fire_resistant` | true |
| `enchantable` | slot `sword`, value 10 |
| `damage` | 7, the same value that makes the Web Sword match a Diamond Sword |
| `digger` | `is_sword_item_destructible`, speed 15 (no digger-tag trap) |
| `tags` | `minecraft:is_sword`, `minecraft:is_tool` |
| durability | **none**: no `minecraft:durability` component (T15) |

**Craft token.** `andrew:dragon_katana_crafted`: the recipe output that the framework swaps for a marked Katana (`L0-lgnd-p001`). `menu_category: none`. (Engine fact: `hasitem` on it is a syntax error; tests check it via the inventory.)

**LegendaryDef #4.** The final values are fixed by `L0-lgnd-ad14` (reconciled at reduce v6); they are repeated here only for reading:
```
itemId: "andrew:dragon_katana", keyPrefix: "dk", abilityKey: "dragon_katana",
nameKey: "item.andrew:dragon_katana", cooldownTicks: 600, craftGate: true,
craftTokenId: "andrew:dragon_katana_crafted",
refund: [["minecraft:golden_apple",2],["minecraft:ender_pearl",2],["minecraft:diamond_sword",1]],
textPrefix: "andrew.katana", command: "andrew:katana",
hudKeys: { ready: "andrew.katana.hud_ready", cooldown: "andrew.katana.hud_cooldown" }
```
`keyPrefix "dk"` must not collide with `ws`, `sc` or `oc`. Once a world holds it, it is frozen (a changed key orphans crafted instances).

**Lifecycle.** craft or `/give` → marked instance (owner, id, gen) → held, dropped, contained, traded freely → death, Void and hazard handling by `lgnd`. The Katana carries no state of its own: the cooldown lives on the player (`andrew:cd_dragon_katana`), and the fall flag lives in memory (`L0-katn-ent2`).
