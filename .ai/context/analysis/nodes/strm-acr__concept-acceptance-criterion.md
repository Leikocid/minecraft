---
type: "concept-acceptance-criterion"
node_id: "L0-strm-acr"
source_channel: "rollout"
analysis_version: 8
title: "AC strm-acr (bds)"
aliases: ["L0-strm-acr"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1580
tags: ["v8", "storm-blade", "channel:bds", "legendary"]
level: 2
---
---
title: "AC strm-acr · Craft once, Creative copy, melee parity, legendary rules with def #6 (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-lgnd", "L0-magn", "L0-strm-edef"]
---
# AC strm-acr (bds)

1. **Once per world.**
   - GIVEN a fresh world, WHEN a Survival player crafts the recipe through a Crafter, THEN they hold `andrew:storm_blade` and one broadcast with the localised name and the player's name is sent.
   - WHEN BDS restarts and a second craft is attempted, THEN no blade appears and the inputs are refunded (2 rods, 2 wind charges, 1 diamond sword).
2. **Simultaneous crafts** of two tokens in the same tick yield exactly one blade (the existing `lgnd` gate scenario, run with def #6).
3. **A Creative or `/give` copy** does not spend the flag: a later Survival craft still succeeds.
4. **Melee parity** (xasm30). Against the same armoured SimulatedPlayer, a blade hit's Δhealth equals a vanilla `diamond_sword` hit's Δhealth, with the RNG forced to "no proc". The same holds with Sharpness V on both.
5. **Unbreakable.** After 200 hits the stack has no durability component and is unchanged.
6. **Legendary rules.** The `lgnd` death-retention, chest-stays, hazards (fire, lava, cactus, TNT, Orbital) and Void → last holder (incl. offline) scenarios iterate over def #6 and pass.
7. **The magnet's** legendary scenarios include def #6 and pass.
8. **Framework diff:** outside `src/storm/`, `packs/`, lang and tests, only `registry.ts` (+def), `main.ts` (+subscriptions) and `src/katana/plan.ts` (exports, per `L0-strm-adtr`) change.
