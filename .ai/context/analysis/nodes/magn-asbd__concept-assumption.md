---
type: "concept-assumption"
node_id: "L0-magn-asbd"
source_channel: "rollout"
analysis_version: 5
title: "magn-asbd · A horse in iron horse armour and a mob holding iron are not pulled"
aliases: ["L0-magn-asbd"]
is_a: ["assumption"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 549
tags: ["is_a:assumption", "CAN_ASSUME", "status:assumed", "relates_to:L0-magn-eirn"]
level: 2
---
# magn-asbd · A horse in iron horse armour and a mob holding iron are not pulled

**Assumption.**
- §4 names the helmet, chestplate, leggings and boots slots, and excludes iron weapons in a mob's hand.
- `iron_horse_armor` is listed only as an *item*.
- So a horse or donkey wearing it (body slot) is not a class 3 candidate.

**Impact if wrong.**
- Adding the body slot is one more tagging command (`hasitem={item=iron_horse_armor}`).
- A pulled horse with a rider raises the question of what happens to the rider, which the spec does not address.
