---
type: "concept-glossary-term"
node_id: "L0-sprj-gl05"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-sprj-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 408
tags: ["is_a:glossary-term"]
level: 2
---
**Virtual projectile**

A Scythe projectile that exists only as a script record `{pos, vel, status}` and is drawn with particles every tick. No engine entity ever exists for it (ADR-023), so it cannot collide with blocks, cannot be orphaned by a crash, and needs no load-time cleanup.

**Synonyms:** bolt, `calamity_bolt` (the particle identifier). **Not:** `minecraft:shulker_bullet` (rejected in ADR-023).
