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
size_chars: 453
tags: ["is_a:glossary-term", "targeting", "visibility"]
level: 2
---
**Visible** (видимый)

From the Scythe spec §3. A candidate is visible if a stable-API block raycast (`getBlockFromRay`, liquids and passable blocks ignored) from the owner's eyes reaches the candidate's head or body centre without hitting a block (`L0-scyt-ad02`, ASM-023). Glass blocks it. Entities, vanilla Invisibility and darkness do not.

Visibility is checked **only at target selection**. Once a target is locked, the projectiles ignore blocks.
