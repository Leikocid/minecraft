---
type: "concept-glossary-term"
node_id: "L0-trap-gtgt"
source_channel: "rollout"
aliases: ["L0-trap-gtgt"]
part_of: ["L0-trap"]
is_a: ["glossary-term"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 830
tags: ["glossary","L0-trap"]
---

**Target point** *(целевая позиция)* / **targeting ray**

The single block cell the cobweb cube is centred on, and the server-side ray that finds it.

The ray is cast once per activation from the player's eye along the view vector, bounded by **reach**, and **stops at the first solid block** — *«Луч упирается в ближайший доступный блок»* (§12). Hitting a wall is a normal resolution, not a failure; the reachable point at the wall becomes the target (R-003). Targeting through a wall is forbidden.

§5 allows three target forms — a point on a block, a player/living entity, or a point immediately next to the owner — all of which collapse into one centre cell before the cube is expanded (`L0-trap-etgt`).

**Synonyms**: raycast, целевая точка, target resolution.
**Not**: a long-range or custom ray — explicitly excluded (§5).
