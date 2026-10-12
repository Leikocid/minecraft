---
type: "concept-process"
node_id: "L0-pear-pr01"
source_channel: "rollout"
analysis_version: 11
title: "Process: craft and token swap"
aliases: ["L0-pear-pr01"]
is_a: ["process"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 2427
tags: ["v11", "pearl-rod", "process", "crafting", "token-swap"]
level: 2
---
# Process: craft and token swap

**Is a:** process. **Part of:** L0-pear. **Relates to:** L0-lgnd (craftgate), L0-xasm43, L0-pear-ru04, C-40, C-46.

## Recipe
- **Type and pattern:** a shaped recipe on a crafting table, written as a full 3×3 `[" P ", " R ", "   "]` with `P = minecraft:ender_pearl` and `R = minecraft:fishing_rod` (`xasm43`, default ingredient per `xq12` item 1).
- **Output:** 1 × `andrew:pearl_rod_token`.
- **Unlocks:** the recipe-book unlock on an ender pearl or fishing rod in the inventory.
- **No craft limit:** no world flag and no gate.
- **C-40 check:** compared against carrot-on-a-stick (rod + carrot in a diagonal or vertical layout), warped-fungus-on-a-stick, and every `packs/behavior/recipes/*` shape. Neither vanilla recipe uses an ender pearl, so no collision is expected. The test asserts it.
- **Fallback:** if the probe shows Bedrock trims blank rows and columns, the 1×2 pattern ships and "shifted or 2×2 crafts are possible" becomes a reported limitation.

## Token item
- `andrew:pearl_rod_token` is a custom item.
- Its icon is the Pearl Rod look, a fishing rod with a pearl tint, in the house icon style. It appears in the recipe book.
- It is not a legendary token, so `defForToken` returns undefined for it (C-46).

## Swap
1. `playerInventoryItemChange` reports a token in a player's inventory. This uses the craftgate's settle-per-tick pattern through the extracted helper.
2. On the settled tick the token stack is replaced, in the same slot, by `new ItemStack("minecraft:fishing_rod", 1)` with:
   - the nameTag;
   - the lore ("Pearl Rod" / "unbound");
   - `andrew:pearl_rod` = a fresh id;
   - damage 0.
3. **Stack of n tokens** (shift-click crafting): n rods, one in the slot and the rest through `addItem`, with any overflow spawned at the feet.
4. **Token outside a player inventory** (a crafter, a hopper, a chest or a ground drop): it is swapped when it enters a player inventory. A token that never does stays a token.
   - **Assumption:** this is acceptable because crafters are rare. A token is unusable as a rod, and the iPad shows the token name «Перовый сокровятель (заготовка)».

## Negative paths
- The swap does nothing for legendary tokens, and craftgate does nothing for this token. Both are asserted in the `lgnd` scenarios, which must stay green after the helper is extracted.
- The input rod's enchantments are not carried over (`xasm43` gap 3, reported).
