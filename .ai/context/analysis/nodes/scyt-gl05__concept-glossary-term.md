---
type: "concept-glossary-term"
node_id: "L0-scyt-gl05"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-scyt-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 470
tags: ["is_a:glossary-term", "shadow-blade", "external"]
level: 2
---
**Hidden by Shadow Blade** (скрыт Теневым клинком)

The state of a player who has an active Shadow Blade ability. Shadow Blade is a future legendary weapon that does not exist yet. A hidden player is excluded from Scythe targeting. The Scythe queries it through the seam `isHiddenByShadowBlade(player): boolean`, which is backed by a durable `andrew:hidden_until` value in epoch ms (CTR-lgnd-03). Today the seam is a stub that always returns `false` (ASM-024, CTR-014).
