---
type: "concept-architecture-decision"
node_id: "L0-adr-prbd"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ADR-L0-prbd · Pearl Rod design (status: proposed; `pear` deep-dive and probe refine it)"
aliases: ["L0-adr-prbd"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 5579
tags: ["v11", "pearl-rod", "teleport", "status:proposed"]
---
---
title: "ADR-L0-prbd · Pearl Rod: a marked vanilla rod, item-borne binding with a life epoch, cancel-then-validate teleport"
aliases: ["L0-adr-prbd", "Pearl Rod design"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0", "L0-pear", "L0-xasm41", "L0-xasm42", "L0-xasm43", "L0-xcx34"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
governs_files: ["src/pearlrod/", "src/legendary/craftgate.ts", "src/structures/spawn-search.ts"]
---
# ADR-L0-prbd · Pearl Rod design (status: proposed; `pear` deep-dive and probe refine it)

**Context.**
- Spec v3 §6–§8 ask for an item that "внешне и при обычной рыбалке работает как удочка" (looks and fishes like a fishing rod), with infinite durability and unlimited crafting.
- Its bobber binds it to a pressure plate. The binder's next use teleports them there, safely and once.
- The binding is voided by the binder's death and by transfer. It must survive a restart.
- The platform is stable `@minecraft/server` 2.10.0 on BDS 1.26.51.

**Decision.**
1. **The item is a marked vanilla `minecraft:fishing_rod`.**
   - The shaped recipe (`xasm43`) outputs `andrew:pearl_rod_token`.
   - A swap reuses the craftgate's settle-per-tick pattern from `playerInventoryItemChange`, with **no gate, no world flag and no refund** (C-46).
   - The swap replaces the token with a fishing rod carrying:
     - `nameTag` «Перовый сокровятель»;
     - a lore line "Pearl Rod", plus the binding status;
     - a dynamic property `andrew:pearl_rod` = a fresh rod id.
   - Real fishing is then free: the loot, Lure, Luck of the Sea and Mending all apply.
   - **Durability:** after each reel or release, and on a slow hand check in the shared interval, the rod's `durability.damage` is written back to 0. A reel costs at most 5, so a 64-durability rod can never break between checks.
2. **Binding detection is a poll, not an event.**
   - A plate has no collision box, so `projectileHitBlock` is expected to report the support block, or nothing at all (the probe decides).
   - A cast is correlated through `itemUse` (a holder of a marked rod) and the `minecraft:fishing_hook` `entitySpawn` in the same tick (the `trdt`/`uwbw` precedent), or through the hook's projectile owner if the probe shows it is readable.
   - While a tracked hook exists, the one shared interval checks the block at the hook's cell. A `*pressure_plate` there, with the hook within 0.25 of the cell floor (`xasm41`), triggers the binding.
3. **The binding lives on the rod.** It is stored as rod dynamic properties: `{dim, x, y, z, plateType, owner: player.id, epoch}`. After writing them the script calls `hook.remove()` and refreshes the lore. A new binding by anyone overwrites the old one.
4. **Owner life epoch (C-45).**
   - `andrew:life_epoch` is a player dynamic property, incremented in `entityDie` for players.
   - A binding is honoured only when `owner === user.id` and `epoch === user.epoch`.
   - So death and transfer need no item search. That matters because rods can sit in chests, drops or unloaded chunks.
5. **Bound use: cancel first, validate after.**
   - When owner and epoch match (a synchronous, cheap check), the cast is cancelled in `beforeEvents.itemUse`, or the hook is removed at `entitySpawn` +0. The probe picks which (`L0-adr-prcn`).
   - `system.run` then starts the async teleport of C-44:
     - preload, through the **world-wide ticking-area allocator** (`L0-adr-prta`; it also serves `spawn-search` and `search-ring`);
     - re-check the plate typeId;
     - re-check the plate generation (`xcx34`);
     - find a safe spot;
     - `teleport` with `dimension`;
     - read the arrival back.
   - On success it clears the binding. On "plate missing or changed" it clears the binding. On a load failure, a full pool or no safe spot, it keeps the binding and reports (`xasm42`).
   - A second use while a teleport is pending is cancelled with a message rather than queued.

**Rejected alternatives.**
- **A custom item `andrew:pearl_rod` with its own bobber entity.** Stable item components have no fishing behaviour, so "normal fishing" would mean re-implementing loot tables, bite timing, Lure and Luck of the Sea, and hooking entities. That is a large, lossy imitation, which C-16 forbids when a vanilla path exists. It is reconsidered only if the probe shows a marked vanilla rod loses its dynamic properties in normal use.
- **Bindings in a world registry keyed by rod id.** It still needs the epoch for death, it duplicates state that has to follow the item through chests and drops, and it leaks entries for rods that despawn. The item-borne record dies with the item.
- **Clearing bindings by scanning inventories on death.** It cannot reach chests, drops or unloaded chunks, which breaks "даже если предмет позже поднимет другой игрок" (even if another player picks the item up later).
- **Teleporting first and checking after**, or relying on the player's own chunk load. That breaks "перед перемещением убедиться" (check before moving) and can land the player in an unloaded void or a block.
- **`runJob` for the preload wait.** `runJob` start stalls the next tick by 15–30 ms (engine fact), so the shared `runInterval` is used.

**Consequences.**
- `craftgate.ts` gives up a token-swap helper, refactored with the `lgnd` scenarios kept green.
- `spawn-search.ts` and `search-ring` give up their ticking-area pools to one world-wide allocator (`L0-adr-prta`), with the structures scenarios kept green.
- The recipe book shows the token's icon. The RP gives the token the Pearl Rod's look (iPad check).
- Anvil renames or combines may drop the mark. The probe records this, and any loss is a reported limitation.
