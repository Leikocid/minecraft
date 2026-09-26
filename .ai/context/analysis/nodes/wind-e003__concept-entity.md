---
type: "concept-entity"
node_id: "L0-wind-e003"
source_channel: "rollout"
analysis_version: 2
title: "Entity — Field Zombie Villager (Windmill guard)"
aliases: ["L0-wind-e003"]
is_a: ["entity"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1500
tags: ["is_a:entity", "mobs", "guards", "relates_to:L0-strf-r009", "relates_to:L0-adr-strs", "relates_to:L0-wind-r004", "relates_to:L0-wind-r005"]
level: 2
---
# Entity — Field Zombie Villager (Windmill guard)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-strf-r009, L0-adr-strs, L0-wind-r004, L0-wind-r005]`

A **vanilla** `minecraft:zombie_villager_v2` with markers applied by script once, at the `looted → guarded` step. Not a custom entity type (`L0-adr-strs` rejected alternative).

| Attribute | Value | Why |
|---|---|---|
| type | `minecraft:zombie_villager_v2` | vanilla curing/AI (§4.5) |
| count per Windmill | exactly 10, one per `guardPoint` | §4.5 |
| tag | `andrew:guard:<instanceId>` | idempotent deficit count (`L0-strf-p004`) |
| `nameTag` | localised guard name (or zero-width, per probe) | Bedrock does not despawn named mobs |
| effect | `fire_resistance`, infinite, amplifier 0, no particles | sun immunity (`L0-strf-as04`) |
| age | adult (spawn event if available) | `L0-wind-as09` |
| position | fixed template-local points on field paths, rotated with the instance | §4.5 "фиксированных/контролируемых позициях" |

## Lifecycle
`spawned (once)` → wanders freely, may leave via fence gaps → one of:
- **dies** → gone forever; no respawn, no top-up; the record stays `done`.
- **cured** (weakness + golden apple, vanilla) → engine replaces it with a new `minecraft:villager`; tag and effect do not carry over; no script re-applies them (`L0-wind-r005`).

## Not guards
Zombie Villagers from the floor-1 spawner: no tag, no name, no effect; they burn in sunlight and despawn like vanilla (§4.5 last bullet).
