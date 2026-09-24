---
type: "concept-process"
node_id: "L0-lgnd-p005"
source_channel: "rollout"
analysis_version: 1
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

Generalised from `registerCooldownHud` in `src/websword/cooldown.ts`. It runs as one `system.runInterval` at 10 ticks, the add-on's only standing interval.

1. For each entry of `world.getAllPlayers()`, skip `undefined` entries (the SimulatedPlayer binding gap, C-2).
2. Collect held legendaries in order: main, then off. De-duplicate by `abilityKey`.
3. If there are none → **write nothing**. Do not even clear the bar (Web Sword §8).
4. Per held weapon, derive a segment:
   - `busy` → `hudKeys.active` (Scythe only, ASM-017).
   - `remaining > 0` → `hudKeys.cooldown` with `ceil(remaining / 1000)` seconds.
   - ready → depends on `readyMode`:
     - `"once"` (Web Sword): show `ready` only in the first pass after expiry (`now - until < 500 ms`), and otherwise contribute nothing.
     - `"while-held"` (Scythe §6: *«Когда готова: Ready»*): always show `ready`.
5. No segments → no write. One segment → `setActionBar(segment)`, which is exactly the shipped rawtext for a Web Sword-only holder. Two segments → `{ rawtext: [seg1, {text: "  "}, seg2] }`.

`readyMode` keeps Web Sword output byte-identical to 0.3.0 for a main-hand-only holder (`L0-lgnd-cx01`).
