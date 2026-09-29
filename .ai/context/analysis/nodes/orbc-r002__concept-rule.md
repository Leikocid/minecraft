---
type: "concept-rule"
node_id: "L0-orbc-r002"
source_channel: "rollout"
analysis_version: 3
title: "Rule · Recipe and lang"
aliases: ["L0-orbc-r002"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1372
tags: ["is_a:rule", "relates_to:L0-lgnd", "recipe", "lang"]
level: 2
---
# Rule · Recipe and lang

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-cx01"]`

**Recipe** (`packs/behavior/recipes/orbital_cannon.json`, shaped, `crafting_table`):
```
 T
TRT
 T
```
- `T = minecraft:tnt`, `R = minecraft:fishing_rod`, result 1× `andrew:orbital_cannon`.
- Spaces are empty and must stay empty. A shaped recipe with no `unlock` shows in the recipe book, as the other legendaries do.
- A *damaged or enchanted* fishing rod is still accepted, because the recipe matches by item id. The item is consumed.
- Whether a craft counts is decided by `lgnd` (`L0-lgnd` craft gate, ACs 1–2). The refund is `4 TNT + 1 fishing rod` (`ent1`).

**Lang** (`en_US.lang`, `ru_RU.lang`), minimum set:
| Key | EN | RU |
|---|---|---|
| `item.andrew:orbital_cannon.name` | Orbital Cannon | Орбитальная пушка |
| `andrew.orbital.first_craft` | §e%s§r forged the legendary §b%s§r! | the RU equivalent |
| `andrew.orbital.craft_blocked` | The world's only Orbital Cannon already exists — ingredients returned | the RU equivalent |
| `andrew.orbital.returned` / `admin_given` / `reset` | as for the other legendaries | the RU equivalent |

The Ready and cooldown strings come from the shared `andrew.legendary.ready` and `andrew.legendary.cooldown` keys (`r012`). See `cx01` for the wording gap. No user-facing string is hard-coded (§13).
