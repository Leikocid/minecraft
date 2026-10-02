---
type: "concept-acceptance-criterion"
node_id: "L0-pick-ac07"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 389
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-pick-r001"]
level: 2
---
GIVEN `copper_ore`, `deepslate`, and `ancient_debris` placed in the GameTest structure, WHEN each is broken with `andrew:miners_pickaxe` vs. a real `minecraft:diamond_pickaxe` in the same run, THEN the pickaxe finishes within `SPEED_TOLERANCE_TICKS` (4) of vanilla and within `BREAK_LIMIT_TICKS` (300). [channel: bds; src: `src/gametest/main.ts` `pickaxe_digs_at_diamond_speed`, L864-962]
