---
type: "concept-assumption"
node_id: "L0-xasm31"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "ASM-L0-31 · What counts as a valid activation"
aliases: ["L0-xasm31"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1493
tags: ["v8", "storm-blade", "CAN_ASSUME"]
---
---
title: "ASM-L0-31 · Valid release, invalid attempt, and the 10-block line"
aliases: ["L0-xasm31", "Storm Blade activation validity"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-katn", "L0-lgnd"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
---
# ASM-L0-31 · What counts as a valid activation

**Assumptions (CAN_ASSUME):**
1. **Valid release:** `resolveActivation` picked the blade, the player is alive, and the eye's chunk is loaded. A miss, a wall at 0.5 blocks and an empty 10 blocks are all valid: they spend the cooldown and draw the line to the stop point.
2. **Invalid (no cooldown spent):** the blade is on cooldown or busy, the stack is stale (a duplicate), the player is dead or spectating, or the blade is not in either hand. The HUD shows the seconds; there is no message.
3. **The line:**
   - It starts at the eye and runs along the view direction for at most 10 blocks of **Euclidean** length. The block ray's budget is cell steps, so it is clamped by distance (memory: `maxDistance` = cell steps).
   - It stops at the first block the Katana's `TRACE_FLAGS` treat as solid. Liquids and passable blocks (grass, flowers, carpet, signs, fire) do not stop it.
   - The hit is the nearest living entity (not the wielder) whose ray intersection is closer than the block stop.

**Impact if wrong:** if liquids should stop the line, flip one flag. If misses should not spend the cooldown, it is a one-line rule change, but §02 says plainly that they do.
