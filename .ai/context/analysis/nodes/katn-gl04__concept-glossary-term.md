---
type: "concept-glossary-term"
node_id: "L0-katn-gl04"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 463
tags: ["glossary-term", "katana", "is_a:glossary-term"]
level: 2
---
**Fall flag**

A per-player, in-memory, one-shot protection that is armed by a successful Katana teleport. It is consumed by the first landing, liquid, climb, glide, death, dimension change or logout, or after 10 s.
- While it is armed and the player is about to hit the ground, a self-teleport resets the fall distance, so that landing deals no damage.
- It is never persisted and never blocks other damage.

**Synonyms**: one-shot fall protection, landing flag.
