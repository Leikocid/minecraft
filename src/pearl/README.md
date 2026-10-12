# Pearl Rod («Перовый сокровятель»)

Spec v3 §6–§8. The Pearl Rod is not a custom item: it is a real vanilla `minecraft:fishing_rod` carrying the dynamic
property `andrew:pearl_rod` (the rod id). A custom item cannot fish, and §6 asks for a rod that "при обычной рыбалке
работает как удочка" (fishes like a normal rod). It is not a legendary either (C-46): crafting is unlimited, and it
drops, burns, despawns and changes hands like any vanilla item.

## `item.ts`: the craft and the durability (`L0-pear-pr01`, `L0-pear-ru04`, `L0-xasm43`)

The decisions live in `item-rules.ts`, which has no engine import; `tests/pearl-item.test.mjs` runs it under node.
`registerPearlItem()` runs at script load. `src/main.ts` arms one copy and the GameTest pack (`src/gametest/pear-item.ts`)
arms its own, because the release pack cannot read a SimulatedPlayer.

**Recipe.** `packs/behavior/recipes/pearl_rod.json` is a shaped crafting-table recipe written as a full 3×3:
`[" P ", " R ", "   "]`, with an ender pearl above a fishing rod and every other cell empty. Bedrock keeps blank rows and
columns (probe Q8), so the positions are fixed.

**Token.** A recipe cannot put a mark on a vanilla item, and a plain rod arriving in an inventory looks exactly like a
pickup. So the recipe outputs `andrew:pearl_rod_token`. That is a custom item: hidden from the Creative menu, stacks to 1,
named "Pearl Rod" / «Перовый сокровятель», with its own icon (`tools/draw-pearl-rod.mjs`; previewed in
`docs/feedback/pearl-rod-token-look.png`). The recipe book and the crafting output slot show it.
- `playerInventoryItemChange` reports the token, and the token is swapped on the next tick, in its own slot. The swap
  queues players per tick and reads each inventory once.
- The swap writes `makePearlRod()`: a new `fishing_rod` with nameTag «Перовый сокровятель», lore `Pearl Rod` / `unbound`,
  a fresh `andrew:pearl_rod` id and damage 0.
- A stack of n tokens gives n rods. Rods that find no room are spawned at the player's feet.
- A token outside a player inventory (in a crafter, a hopper, a chest or on the ground) stays a token until a player
  picks it up.

**Durability.** "Бесконечная прочность" (infinite durability) means damage held at 0. A vanilla rod has 384 durability
on Bedrock, and a ground reel costs 2 (probe Q7). A marked rod's `durability.damage` is written back to 0 on three paths:
1. **In `afterEvents.itemUse`**, for a cast and for a reel. The reel's damage is already on the rod when the event
   arrives, so it is zeroed in the same tick.
2. **One tick later** (`REPAIR_AFTER_USE_TICKS`), on the same slot. This catches damage the engine might apply after the
   event. In the 100-cast run it never found anything to repair.
3. **The hand check**, every 20 ticks, on each player's selected slot. It writes only when the rod is worn.

A plain rod is never touched. The fallback "swap in a fresh marked rod" (`L0-pear-ru04`) is not needed: the write holds
(probe Q7).

**Not extracted from craftgate.** `L0-pear` names a token-swap helper extracted from `src/legendary/craftgate.ts`. That
helper is not extracted. The craftgate's settle step is legendary-shaped (claim, refund, unwrap, the world flag, the
announcement), and the Pearl Rod needs one branch of it. So `item.ts` repeats the 30-line queue-and-flush pattern instead
of reshaping a module that every legendary craft goes through. Craftgate ignores the Pearl Rod token (`defForToken` is
undefined for it), and the swap ignores legendary tokens.

### Measured on BDS 1.26.51.1 (private copy of the checks instance, 2026-10-12)

- **`pear_item_craft_unlimited`.** A crafter runs the shipped recipe three times in a row. 3 tokens reach the player and
  3 swaps follow. The player ends with 3 Pearl Rods, 3 distinct marks, 0 tokens and 0 plain rods. Each rod reads
  `name=Перовый сокровятель lore=[Pearl Rod|unbound] damage=0/384 enchants=[]`.
- **`pear_item_grid_shifted`.** The declared layout (1,4) crafts a token, both before and after the negatives. None of
  the 8 moved layouts crafts anything:
  - left (0,3), right (2,5), down (4,7), down-left (3,6), down-right (5,8);
  - pearl below the rod;
  - the diagonal (0,4);
  - side by side (3,4).
- **`pear_item_hundred_casts`.** Two players cast and reel 100 times each, side by side.
  - The Pearl Rod: 100 hooks and 100 reels; damage 0 at the end of all 100 cycles and at the end; mark unchanged;
    `repairs_in_event=100`, `repairs_after_use=0`.
  - The plain rod (control): 100 hooks and 100 reels, damage 0 → 200.
  - Event order in one tick: the reel's damage is already readable in the tick of the reel, before the after-event
    (`+11:damage 0->2 +11:hook_removed +11:use(d=2)`). So a script that samples every tick sees the Pearl Rod at damage 2
    for exactly 1 tick per reel (`worn_ticks=100`, worst 2).
  - Hand check: damage 50 written onto the held Pearl Rod returns to 0 within the 20-tick period (+12 and +18 in two
    runs). A plain rod at 50 stays at 50.
  - SimulatedPlayer drops uses that come too close together (498 calls for 200 effective uses, one accepted about every
    11 ticks). So the scenario drives each cast and reel by its evidence: a new hook, or the hook gone.
- **`pear_item_fishes_unbound`.** A one-block-deep pool runs past the platform edge. A hook that lands against a wall
  reads as stuck in a block: a reel costs 2 and nothing bites. Each player casts until a catch, reeling when the bobber is
  pulled under (drop > 0.30 or vy < −0.25).
  - The Pearl Rod caught `salmon×1` on its 2nd cast (loot spawned at the hook, picked up 11 ticks after the reel). It ended
    at damage 0, lore `Pearl Rod|unbound`, dynamic properties `[andrew:pearl_rod]` only.
  - The plain rod (control) caught `cod×1`, damage 1.

### Limitations (C-16)

- **The input rod's enchantments are lost.** The output is always a new rod. By the time the token exists, the
  ingredients are gone, so nothing of the rod that went in can be read back. This is the same limitation as craftgate's
  refund (`L0-xasm43`, gap 3). The engine half is not measured: a crafter has no `minecraft:inventory` component on
  1.26.51.1, and `replaceitem` cannot enchant, so no enchanted rod can be loaded into it.
- **The name and the lore do not follow the client's language.** A vanilla rod has no translation key to point at, so the
  nameTag «Перовый сокровятель» and the lore `Pearl Rod` / `unbound` are literal strings. An English iPad shows the
  Russian name too (`xq12` item 2). The token's own name is a lang key and does follow the language.
- **The 2×2 inventory grid is not measured.** No script can operate it. What is measured is that Bedrock keeps the blank
  third row and column, so the recipe needs three rows and a 2×2 grid cannot hold it. Whether the 2×2 grid offers the
  recipe is checked on the iPad.
- **As an ingredient it is a plain rod** (`L0-xasm45`). The Orbital Cannon recipe, carrot-on-a-stick,
  warped-fungus-on-a-stick and the Pearl Rod's own recipe all consume it as a plain rod, along with its id and its
  binding. A craftgate refund of a duplicate Orbital Cannon returns a plain rod.
- **An anvil rename or combine is not measured** (no SimulatedPlayer anvil). It may drop the mark.

### For the iPad sheet (`PEAR-IPAD-01-AA`)

- **The durability bar may blink.** On the server the reel's damage exists for one tick before it is written back
  (above). Whether the client draws that tick is visible only on the device. Look at the bar during fast casting.
- **Name and lore** are fixed strings: «Перовый сокровятель» with `Pearl Rod` / `unbound` below, in Russian on an English
  iPad too.
- **The recipe book** shows the token's icon (a rod with a teal pearl on its line). The rod you get looks like a vanilla
  fishing rod.
- **The 2×2 grid** must not offer the recipe.
- **An enchanted rod** used as the ingredient yields an unenchanted Pearl Rod.
