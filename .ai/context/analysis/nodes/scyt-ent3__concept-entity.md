---
type: "concept-entity"
node_id: "L0-scyt-ent3"
source_channel: "rollout"
analysis_version: 1
title: "ScytheActivationOutcome (enumeration, press-level view)"
aliases: ["L0-scyt-ent3"]
is_a: ["entity"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1451
tags: ["is_a:entity", "outcome", "cooldown"]
level: 2
---
# ScytheActivationOutcome (enumeration, press-level view)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p001", "L0-sprj-r005", "L0-scyt-r003", "L0-scyt-r007"]`

This is every way one Use press of the Scythe can end. The `L0-sprj` volley outcomes are nested under `LAUNCHED`.

| Outcome | When | Cooldown | Player-visible |
|---|---|---|---|
| `NOT_DISPATCHED` | The dispatcher chose another ability, or the Scythe is on cooldown | unchanged | HUD shows the remaining time |
| `BUSY` | The owner's volley is still flying | unchanged | HUD shows "active" |
| `INELIGIBLE_OWNER` | The owner is dead, a spectator or in Creative | none | nothing |
| `NO_TARGET` | No candidate passed r001 | **none** | «Здесь нет игрока» |
| `LAUNCHED` → `COMPLETED` | All projectiles resolved, hits ≥ 1 | full 30 s | 1–3 hits |
| `LAUNCHED` → `EXPIRED` | All projectiles expired, 0 hits | none | nothing |
| `LAUNCHED` → `ESCAPED_BEFORE_HIT` | The target is past 20 blocks with 0 hits | **none**, ready at once | the projectiles vanish |
| `LAUNCHED` → `ESCAPED_AFTER_HIT` | The target is past 20 blocks with hits ≥ 1 | full 30 s | the projectiles vanish |
| `LAUNCHED` → `TARGET_INVALID` | The target died, left, changed dimension or changed mode | split on hits | the projectiles vanish |
| `LAUNCHED` → `OWNER_INVALID` | The owner died, left or changed dimension | split on hits, committed at the first hit | the projectiles vanish |
