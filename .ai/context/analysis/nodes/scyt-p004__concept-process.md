---
type: "concept-process"
node_id: "L0-scyt-p004"
source_channel: "rollout"
analysis_version: 5
title: "P-scyt-004 — Registration and first Survival craft"
aliases: ["L0-scyt-p004"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1189
tags: ["is_a:process", "registration", "craft", "delta:2026-09-26"]
level: 2
---
# P-scyt-004 — Registration and first Survival craft

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-lgnd", "L0-scyt-r009", "L0-scyt-ent1", "L0-scyt-ac11"]`

The Scythe is the second entry in `LEGENDARIES` (`src/legendary/registry.ts`). `L0-lgnd` supplies the craft gate, refund, announcement, retention, Void return and `/andrew:scythe` admin command for it, keyed by `keyPrefix: "sc"` and `textPrefix: "andrew.scythe"`.

1. A crafting-table recipe `andrew:scythe_of_calamity` (`L0-scyt-r009`) in Survival or Adventure.
2. `craftDecision` reads `andrew:sc_crafted`. It is per weapon and independent of the Web Sword's `andrew:ws_crafted`.
3. **First craft:** set the flag and broadcast `andrew.scythe.first_craft` («§e%s§r выковал легендарную §b%s§r!»).
4. **Repeat:** block it, refund 2 golden apples, 2 obsidian and 1 diamond hoe, and show `andrew.scythe.craft_blocked`.
5. **Creative or Spectator crafts** are not counted (`craftDecision`). `/andrew:scythe` gives a test copy (`admin_given`) or resets the flag (`reset`).
6. The flag persists across restart.

The ability wiring is `registerScytheVolley()` (targeting → volley), called from `src/main.ts`.
