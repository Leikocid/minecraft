---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl13"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-gl13"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 739
level: 2
---
---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad12", "L0-lgnd-p003"]
---
**Departure (in-flight instance)**

A live marked legendary that has just left a player's inventory slot or off hand. Recovery records it in `inFlight` (`recovery.ts:106`) and resolves it after a short grace period.

- If the player swung to drop within ±2 ticks, the instance is searched for: watched ground entities, every player's inventory and off hand, and block containers around the departure cell. Found nowhere means lost, which means returned (v1.4.2 fix `5a68b84`).
- A departure without a drop swing is a store the script cannot see (a shulker item or the ender chest), and is never a loss.

**Synonyms**: in-flight, left-a-slot.
