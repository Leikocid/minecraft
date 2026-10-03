---
type: "concept-rule"
node_id: "L0-katn-r005"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r005"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1218
tags: ["rule", "katana", "cooldown", "is_a:rule", "relates_to:L0-lgnd-p004", "relates_to:L0-lgnd-p005"]
level: 2
---
---
title: "R-katn-005: Cooldown only on a successful teleport; an attempt on cooldown changes nothing"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-p005", "L0-katn-p001"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.**
- `startCooldown(player, "dragon_katana")` (600 ticks = 30 000 ms, epoch ms) is called **only** after `player.teleport` returned without throwing, in the same turn.
- The cooldown is per player and ability (`andrew:cd_dragon_katana`), synchronised by the server, and survives a restart (`L0-lgnd-p005`).
- A refusal (no safe cell, all unreadable, wrong def resolved) never writes the timer.
- **On cooldown**, a Use press is a no-op. There is no teleport, `andrew:cd_dragon_katana` is unchanged, and there is no chat message. Only the HUD shows the remaining seconds.
- The Katana never sets the framework's busy window: the ability is instant. Swapping hands after a success changes nothing.
- **Off hand.** With another legendary ready in the main hand, the main hand wins. With the main hand on cooldown and the Katana ready in the off hand, the Katana fires (`L0-lgnd-p004`).
- Melee hits work at any cooldown state.

Source: Katana §5, §9, §11; T05, T14.
