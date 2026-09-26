---
type: "concept-glossary-term"
node_id: "L0-scyt-gl03"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-scyt-gl03"]
is_a: ["glossary-term"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 483
tags: ["is_a:glossary-term", "targeting", "visibility", "delta:2026-09-26"]
level: 2
---
**Links:** `part_of: ["L0-scyt"]` · `is_a: ["glossary-term"]` · `relates_to: []`

**Visible** (видимый)

From Scythe spec §3. There is line of sight from the owner's eyes to the candidate's eyes: every block cell sampled along the segment, except the two endpoint cells, is air or liquid (`L0-scyt-ad02`). Glass, leaves, grass, slabs and unloaded cells block it. Entities, vanilla Invisibility and darkness do not.

It is checked only at target selection. Projectiles ignore blocks.
