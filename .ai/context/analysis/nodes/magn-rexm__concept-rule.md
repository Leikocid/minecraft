---
type: "concept-rule"
node_id: "L0-magn-rexm"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rexm"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 914
tags: ["is_a:rule", "drop-exemption", "relates_to:L0-magn-adex", "see_also:ufomagnetspecv1ruen-part-2"]
level: 2
---
**Rule (UFO §5, AC-6).** Iron dropped near the saucer during the magnet is pulled **in addition to** the 10-element limit.

- **Trigger.** An `entitySpawn` of `minecraft:item` happens while the magnet is on. The stack is in IRON_ITEMS and is not legendary. The spawn point is ≤ 12 blocks (3-D) from the hover point, the saucer position.
- **Effect.** The item is appended as a class `X` element with the next ring slot (the ring is re-spaced over n slots).
- **Source.** No attribution is made to a player; any iron item spawning in that sphere qualifies (`L0-magn-adex`). Items spawned by the magnet itself (extraction, block items) are already elements and are ignored by the listener.
- **No cap.** Each drop needs a player action, so the number of `X` elements is not capped.
- **Further out.** An iron item dropped more than 12 blocks from the hover point (a player on the ground, for example) is not pulled.
