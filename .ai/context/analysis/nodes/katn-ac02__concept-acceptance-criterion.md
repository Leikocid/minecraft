---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac02"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 820
tags: ["acceptance-criterion", "katana", "channel:bds", "T04", "T14", "T15", "is_a:acceptance-criterion"]
level: 2
---
---
title: "AC-katn-02 (T04, T14, T15, bds): melee equals a Diamond Sword, works on cooldown, no wear"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r001", "L0-katn-r005"]
---
- **T04.** GIVEN two identical husks (spawnWithoutBehaviors, full health), WHEN one SimulatedPlayer hits one with a vanilla Diamond Sword and the other with the Katana (no crit, same cooldown charge), THEN the health losses measured via `entityHurt` are equal.
- **T14.** GIVEN `andrew:cd_dragon_katana` armed (cooldown > 25 s), WHEN the player attacks a husk, THEN the hit deals the T04 damage and the cooldown value is unchanged.
- **T15.** WHEN the player lands 50 hits and 3 successful activations, THEN the stack has no durability component, and `getComponent("durability")` stays `undefined`, as it was before.
