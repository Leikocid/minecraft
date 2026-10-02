---
type: "concept-entity"
node_id: "L0-magn-eelm"
source_channel: "rollout"
analysis_version: 5
title: "Magnet element and held player (transient, never persisted — C-23)"
aliases: ["L0-magn-eelm"]
is_a: ["entity"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1414
tags: ["is_a:entity", "relates_to:L0-magn-rlim", "relates_to:L0-magn-phld"]
level: 2
---
# Magnet element and held player (transient, never persisted — C-23)

## Element (non-player)
| Attribute | Meaning |
|---|---|
| `entity` | The moved entity: an item, mob, minecart or armour stand. Block and container sources are already materialised as item entities. |
| `cls` | 1 ground item · 2 container stack · 3 mob/minecart · 4 built block · 5 ore · `X` exempt drop |
| `origin` | Where it was picked from. Used for nearest-first ordering and for logs. |
| `slot` | The index of its ring position (angle = 2π·slot/n, plus a slow rotation). |
| `arrived` | True once it has reached its slot; before that it moves at the flight speed (`L0-magn-asfl`). |

- The set is fixed at magnet-on: at most 10 counted elements, plus any number of `X` elements.
- An element whose entity becomes invalid (picked up, killed, despawned) is dropped from the set. Its slot is **not** refilled from new candidates.

## Held player (not counted)
| Attribute | Meaning |
|---|---|
| `player` | A Player in the zone and not in Creative or Spectator. |
| `pulling` | Recomputed every tick: is iron in the main or off hand? |

- There is no stored state beyond the event: when a player leaves the zone or stops holding iron, they are simply not pulled that tick.

## Magnet session
`{eventId, centre, hoverY, zone, elements[], startedTick}` exists only from magnet-on to release. On a restart nothing is rebuilt (`L0-adr-ufom`).
