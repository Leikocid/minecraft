---
type: "concept-process"
node_id: "L0-lgnd-p005"
source_channel: "rollout"
analysis_version: 7
title: "P-lgnd-005: Single Action Bar HUD (both hands)"
aliases: ["L0-lgnd-p005"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1315
tags: ["process", "hud", "actionbar"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r007", "L0-lgnd-cx01", "L0-sitm"]
---
# P-lgnd-005: Single Action Bar HUD (both hands)

Implemented as `registerLegendaryHud` / `hudMessage` in `src/legendary/hud.ts`. It runs as one `system.runInterval` at 10 ticks, the add-on's only standing interval.

1. For each entry of `world.getAllPlayers()`, skip `undefined` entries (the SimulatedPlayer binding gap, C-2).
2. Collect held legendaries in order: main, then off. De-duplicate by `abilityKey`.
3. If there are none → **write nothing**. Do not even clear the bar (Web Sword §8).
4. Per held weapon, derive a segment:
   - no busy segment: during a volley the bar shows Ready (`L0-lgnd-ad07` §6).
   - `remaining > 0` → `andrew.legendary.cooldown` (name, `ceil(remaining/1000)`); otherwise → `andrew.legendary.ready` (name), on every pass while held (decision-legendary-ready-hud).
5. No segments → no write. Always `{ rawtext: [...] }`; segments separated by `{ text: "   " }` (three spaces, `hud.ts:45`).
