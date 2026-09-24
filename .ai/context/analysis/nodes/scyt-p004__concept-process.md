---
type: "concept-process"
node_id: "L0-scyt-p004"
source_channel: "rollout"
analysis_version: 1
title: "P-scyt-004 — Registration and first Survival craft"
aliases: ["L0-scyt-p004"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1463
tags: ["is_a:process", "craft", "one-per-world", "registry"]
level: 2
---
# P-scyt-004 — Registration and first Survival craft

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-lgnd", "L0-sitm", "L0-scyt-r009", "L0-scyt-ent1"]` · source: Scythe §1, §2, §8 test 11.

The Scythe adds no private craft, retention or HUD code. It **registers** with `L0-lgnd`:

```
registerLegendary({
  id: "andrew:scythe_of_calamity",
  abilityKey: "scythe",          // key prefix `sc` (L0-lgnd-as02)
  cooldownMs: 30_000,
  langPrefix: "andrew.scythe_of_calamity", // .ready / .cooldown / .no_target / .announce
  ability: (player, hand) => activate(player),  // L0-scyt-p001
  isBusy: (playerId) => volleys.has(playerId),   // L0-sprj-r007
})
```

## First-craft flow (behaviour is inherited from `L0-lgnd`)
1. A player crafts the shaped recipe `andrew:scythe_of_calamity` (`L0-scyt-r009`) in Survival.
2. The craft gate reads the Scythe's own world flag. It is per weapon, not shared with the Web Sword (L0-lgnd-as01).
3. **First craft:** set the flag durably and broadcast the localized announcement with the weapon name and the crafter's name.
4. **Repeat craft:** block it and refund the ingredients, exactly as the Web Sword gate does.
5. Creative and `/give` / the operator command give copies without spending the flag.
6. **Restart:** the flag persists (spec test 11).

Death retention, Void return and anti-dup are generic `L0-lgnd` behaviour. They apply unchanged, including the open CTR-011/CTR-018 scope question.
