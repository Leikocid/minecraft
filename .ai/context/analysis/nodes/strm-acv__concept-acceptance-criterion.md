---
type: "concept-acceptance-criterion"
node_id: "L0-strm-acv"
source_channel: "rollout"
analysis_version: 8
title: "AC strm-acv (bds)"
aliases: ["L0-strm-acv"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1359
tags: ["v8", "storm-blade", "vanilla-recipes", "channel:bds", "C-30", "C-31"]
level: 2
---
---
title: "AC strm-acv · Visuals act on nothing; vanilla recipes yield vanilla items (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rvis", "L0-strm-ercp", "L0-adr-sbvr"]
---
# AC strm-acv (bds)

1. **No lightning entity.** After an active hit and a forced passive proc on a pig and a villager:
   - the count of `minecraft:lightning_bolt` in the dimension is 0;
   - there are no `zombie_pigman`/`zombified_piglin` or `witch` entities, and the pig and villager are still present;
   - no fire block lies within 3 cells of either point;
   - no block in the test volume has changed.
2. **Grep check.** `lightning_bolt` does not appear in `src/storm/` (CI check).
3. **Elytra.**
   - Two Crafter crafts of 6 feathers + a diamond chestplate yield 2× `minecraft:elytra`: the exact type id, no dynamic properties, no lore, and empty inputs.
   - A Survival player with no prior craft can do it twice: there is no uniqueness flag.
4. **Totem.**
   - Two Crafter crafts of 8 gold ingots + an emerald yield 2× `minecraft:totem_of_undying` with the same checks.
   - A crafted totem in the off hand saves a SimulatedPlayer from lethal `applyDamage`, the same as a `/give` totem.
5. **Ordinary items.** A crafted elytra and totem dropped into lava burn. They are not protected, and they are not pulled by the magnet's legendary path.
