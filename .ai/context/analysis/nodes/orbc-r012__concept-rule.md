---
type: "concept-rule"
node_id: "L0-orbc-r012"
source_channel: "rollout"
analysis_version: 5
title: "Rule · HUD (Action Bar)"
aliases: ["L0-orbc-r012"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 983
tags: ["is_a:rule", "relates_to:L0-lgnd", "relates_to:L0-orbc-cx01", "hud"]
level: 2
---
# Rule · HUD (Action Bar)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-cx01", "L0-orbc-ac10"]`

- The HUD is rendered by the shared `src/legendary/hud.ts`, every 10 ticks. The Cannon joins by being in `LEGENDARIES`. It adds no HUD code of its own.
- It is shown while the Cannon is in the **main or off hand** (§7). The off hand needs `allow_off_hand` (`ent1`, `L0-lgnd-cx08`).
- **Ready:** `{name} — Ready`, `Орбитальная пушка — Готово`.
- **Cooldown:** `{name} — {ceil(remaining s)}s`, `…— 27с`.

  The remaining time is read from the shared per-player key. Every copy the player holds shows the same number.
- If a Web Sword or Scythe is held in the other hand, both segments are shown, separated by three spaces (existing behaviour).
- The HUD is independent per player. It never shows another player's cooldown.
- The wording is **pending `cx01`**. The shared keys currently render `Orbital Cannon: Ready` and `Orbital Cannon: 27 s`.
