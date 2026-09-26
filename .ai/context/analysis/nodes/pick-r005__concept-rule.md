---
type: "concept-rule"
node_id: "L0-pick-r005"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-pick-r005"]
is_a: ["rule"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 540
tags: ["is_a:rule", "recipe", "relates_to:L0-pick-ent1"]
level: 2
---
**Rule R5 — Recipe is a single fixed shape, no substitutions.**

One `minecraft:recipe_shaped` entry, `crafting_table` tag only:

```
III
GSG
 S
```

`I` = Iron Ingot, `G` = Raw Gold, `S` = Stick, blank = empty. Result: 1× `andrew:miners_pickaxe`. Matches the raw spec exactly (top row 3 iron; middle row raw gold/stick/raw gold; bottom row empty/stick/empty). `unlock` is granted on picking up an Iron Ingot. No shapeless or alternate-ingredient variants exist. [src: `packs/behavior/recipes/miners_pickaxe.json`; `minerspickaxetestspec`]
