---
type: "concept-architecture-decision"
node_id: "L0-magn-adex"
source_channel: "rollout"
analysis_version: 5
title: "ADR magn-adex · The drop exemption is detected by `entitySpawn` in a 12-block sphere, without player attribution"
aliases: ["L0-magn-adex"]
is_a: ["architecture-decision"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1094
tags: ["is_a:architecture-decision", "status:proposed", "relates_to:L0-magn-rexm"]
level: 2
---
# ADR magn-adex · The drop exemption is detected by `entitySpawn` in a 12-block sphere, without player attribution

**Context.**
- UFO §5: "an iron item that a player dropped near the saucer (≤ 12 from the hover point) during the magnet is pulled beyond the limit".
- The stable API gives no thrower or owner on an item entity spawn.

**Decision.**
- While the magnet is on, subscribe to `world.afterEvents.entitySpawn`.
- Accept `minecraft:item` entities whose stack is iron and not legendary, and whose location is ≤ 12 blocks from `saucerPosition()`.
- Ignore ids the magnet itself spawned (the extraction set).
- Unsubscribe at release.
- In practice only players hovering 6 blocks below the saucer drop items in that sphere. A held player's death drops would also qualify, which is harmless.

**Rejected alternatives.**
- **`playerInventoryItemChange` correlation**, linking a lost stack to a spawn in the same tick. It is fragile: script `addItem` also fires this event (engine fact), and it costs more for no gameplay gain.
- **Re-scanning ground items every tick.** That violates C-5d.
