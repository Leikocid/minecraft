---
type: "concept-acceptance-criterion"
node_id: "L0-pick-ac06"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-pick-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 350
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-pick-r002"]
level: 2
---
GIVEN a fresh `andrew:miners_pickaxe` ItemStack, WHEN queried in-engine, THEN `ItemEnchantableComponent.canAddEnchantment === true`, `canAddEnchantment` accepts unbreaking and efficiency and refuses sharpness, and `minecraft:durability` is absent. [channel: bds; src: `SELFTEST-01-AA` / `src/selftest/main.ts` `pickaxe-enchantable`]
