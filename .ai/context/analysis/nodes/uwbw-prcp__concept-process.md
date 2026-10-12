---
type: "concept-process"
node_id: "L0-uwbw-prcp"
source_channel: "rollout"
analysis_version: 10
title: "P-uwbw-rcp · The three recipes"
aliases: ["L0-uwbw-prcp"]
is_a: ["process"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1509
tags: ["v10", "underwater-bow", "recipes", "mace", "firework-rocket", "process"]
level: 2
---
# P-uwbw-rcp · The three recipes

**Links.** relates_to: L0-lgnd, L0-trdt-adrf, L0-uwbw-r004, L0-uwbw-adrc, L0-xasm39, C-34, C-40.

## 1. The bow
`packs/behavior/recipes/underwater_bow.json`, `minecraft:recipe_shaped`, tag `crafting_table`:

```
" R "
"BWB"
" S "
```

- R = `minecraft:lightning_rod`, B = `minecraft:water_bucket`, W = `minecraft:bow`, S = `minecraft:sand`.
- Result: 1 `andrew:underwater_bow_crafted` (the token).

**Exchange.** `craftgate` sees the token in `playerInventoryItemChange` and acts on the flag:
- **flag unset:** replace the token with the marked bow, set the craft flag, and add 2 `minecraft:bucket` (`craftReturn`; where the inventory is full, they drop at the feet);
- **flag set:** refund R + W + 2 water buckets + S, with **no** empty buckets.

The water buckets are consumed by the recipe with no engine container return (`trdt` P1 branch).

## 2. The Mace
`mace_iron_block.json`, shaped:

```
"I"
"Z"
```

- I = `minecraft:iron_block`, Z = `minecraft:breeze_rod`.
- Result: 1 `minecraft:mace`, no token and no script.

## 3. The rockets
`firework_rocket_paper.json`, shaped:

```
"P"
"S"
```

- P = `minecraft:paper`, S = `minecraft:string`.
- Result: `{item: minecraft:firework_rocket, count: 3}`.

## What does not change
The vanilla Heavy Core Mace and the shapeless Paper + Gunpowder (+ Firework Star) rockets stay.

**Recipe book.** All three unlock as normal recipes. The bow's book entry shows the token's icon and name: the bow's icon, and lang "Underwater Bow".
