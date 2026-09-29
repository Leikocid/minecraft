---
type: "concept-assumption"
node_id: "L0-lgnd-as13"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-lgnd-as13"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 1549
tags: ["v3-delta", "CAN_ASSUME", "probe"]
level: 2
---
---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad08", "L0-lgnd-r014", "L0-lgnd-p001", "L0-lgnd-ac15"]
---
**ASM-lgnd-13: A recipe can output a hidden token item that looks like the weapon, and the swap is invisible in practice.**

This assumes all of the following on 1.26.50 / BDS 1.26.51.x:
- A shaped recipe's `result` can be a custom item with `menu_category: none`.
- The crafting-table and 2×2 previews and the recipe book show its icon and localized name. Given the same `minecraft:icon` and a lang name equal to the weapon's, the result looks the same as the real weapon.
- `playerInventoryItemChange` fires when the token reaches any inventory slot. That includes a click-craft that leaves it on the cursor and is then placed, and the iPad craft button that moves it straight into the inventory.
- Replacing it in the next tick causes no client flicker that matters.
- A vanilla `/give @p andrew:<item>_crafted` is possible but obscure, and it would claim. That is accepted: it is the documented way to *simulate* a craft in tests.

**Impact if wrong.**
- If the recipe book hides `menu_category: none` results, set the category to `items` with `is_hidden_in_commands`, or accept the token being visible in Creative search.
- If `playerInventoryItemChange` misses the cursor-to-drop path (the player throws the crafted token straight out of the UI), the token claims later, when it is picked up. The outcome is the same.
- If the whole approach fails, fall back to `ad08` rejected (c) and document that `/give` claims.
