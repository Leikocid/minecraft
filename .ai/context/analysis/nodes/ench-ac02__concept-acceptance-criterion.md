---
type: "concept-acceptance-criterion"
node_id: "L0-ench-ac02"
source_channel: "rollout"
analysis_version: 10
title: "AC-ench-02 · The rare stage hits ≈ 20 % of valid generations; curses 0 %"
aliases: ["L0-ench-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 935
tags: ["v10", "enchanting", "rare-stage", "C-39", "channel:unit", "spec-5-bullet-4"]
level: 2
---
# AC-ench-02 · The rare stage hits ≈ 20 % of valid generations; curses 0 %

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r004, L0-ench-r001

**GIVEN** `rollEnchantments` at tier 3 for each of `minecraft:mace`, `minecraft:diamond_boots`, `minecraft:bow`, `minecraft:diamond_pickaxe` and `andrew:underwater_bow`,
**WHEN** it is called 1 000 times per item with a fixed seed, and 1 000 times per item unseeded,
**THEN**:
- results with ≥ 1 rare member number in [162, 238] per 1 000 valid generations;
- every `rareStage:'miss'` result holds 0 rare members;
- `binding` and `vanishing` occur **0** times in all results.

**AND** an item with no eligible rare enchantment always reports `rareStage:'none'` and is excluded from the count.

**Channel:** `unit` (`node --test`, in_process). Per C-39 this closes the roller criterion only, not §5 bullet 4 in the engine. That needs an approved hook (`ac06`).
