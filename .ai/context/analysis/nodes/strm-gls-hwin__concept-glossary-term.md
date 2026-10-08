---
type: "concept-glossary-term"
node_id: "L0-strm-gls-hwin"
source_channel: "rollout"
analysis_version: 8
aliases: ["L0-strm-gls-hwin"]
is_a: ["glossary-term"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 528
tags: ["v8", "glossary", "storm-blade"]
level: 3
---
**Hurt window (окно неуязвимости)**

The 10 ticks (`HURT_WINDOW_TICKS`, `src/sculk/hit.ts`) after a landed hit, during which the engine swallows a weaker or equal `applyDamage` (taking 0) and takes only the difference from a stronger one (compared after armour). `applyDamage` returns true either way.

The Storm Blade's passive always lands inside its own melee hit's window. "**Difference-stacking**" (`applyDamage(L + D)`) is the strm technique that nets D only without armour; on armour it deals one L + D hit. The passive raises the melee hit instead (`L0-adr-sbdm`).

**Synonyms:** invulnerability frames, i-frames, hurt cooldown.
