---
type: "concept-rule"
node_id: "L0-pick-r004"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-pick-r004"]
is_a: ["rule"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 826
tags: ["is_a:rule", "scope-boundary", "auto-smelt"]
level: 2
---
**Rule R4 — Everything outside the auto-smelt allow-list, and every other tool, keeps vanilla behavior unchanged.**

The auto-smelt handler returns immediately (no-op) unless both conditions hold: held item is `andrew:miners_pickaxe` **and** the target block is one of the seven ids in R3's map (`L0-pick-r003`). A block outside the list (e.g. stone) breaks and drops normally even when mined with the pickaxe; the pickaxe on a non-listed block, and any other tool on a listed block, both fall through to vanilla. Enforced by `pickaxe_keeps_vanilla_drops` (GameTest): mines `minecraft:stone` with the pickaxe and asserts the drop is `minecraft:cobblestone`, not `minecraft:iron_ingot`. This is the scope boundary that keeps Stage 1 a probe rather than a general "pickaxe mining rework." [src: `src/gametest/main.ts` L198-207]
