---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad08"
source_channel: "rollout"
analysis_version: 3
title: "AD-lgnd-08: Craft provenance through a recipe-only token item"
aliases: ["L0-lgnd-ad08"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 3170
tags: ["v3-delta", "status:proposed", "resolves:L0-xcx9"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-xcx9", "L0-lgnd-p001", "L0-lgnd-r014", "L0-lgnd-ac15", "L0-lgnd-as13", "L0-orbc", "L0-webs", "L0-scyt"]
---
# AD-lgnd-08: Craft provenance through a recipe-only token item

**Context.** Orbital §4 and AC-2 say Creative and `/give` copies must not consume or change the craft flag. The gate (`craftgate.ts`, `rules.ts:41` `craftDecision`) claims **any** unmarked legendary that shows up in a Survival player's inventory. Stable 2.10.0 has no craft event, so a vanilla `/give @p andrew:orbital_cannon` claims the world's craft (`L0-xcx9`). A Creative copy dropped to a Survival player claims it too. This affects all three weapons.

**Decision.**
1. **The recipe output is a token.** Each weapon's shaped recipe outputs `def.craftTokenId` (`andrew:<item>_crafted`), not `def.itemId`.
   - The token has the **same icon and display name** as the weapon, so the crafting-UI preview looks the same.
   - It has `menu_category: none`: it is hidden from the Creative inventory and from search.
   - It has `max_stack_size: 1` and no other behaviour.
2. **The gate watches tokens only.** `playerInventoryItemChange` with `typeId == def.craftTokenId`, then the `craftDecision` flow:
   - `claim`: replace the token in the same slot with a marked `def.itemId` (origin `craft`, `holder` = crafter), then set the flag, then broadcast.
   - `refund`: remove the token and hand back `def.refund`.
   - Creative/Spectator: swap the token for a plain, **unmarked** `def.itemId` without touching the flag. A Creative crafting-table craft stays an ordinary copy, as it is today.
3. **A plain `def.itemId` stack is never gated.** A vanilla `/give`, a Creative pick or a Creative copy handed to a Survival player is an ordinary copy (`as11`). The gate's unmarked-`itemId` branch is deleted.
4. The token is a craft-in-flight. If it sits in a chest or a crafter's output, or lies on the ground, nothing is claimed until a player's inventory receives it. Two tokens of one weapon: the first to reach an inventory claims, and the other is refunded. Flush ordering is unchanged.

**Rejected.**
- (a) **A heuristic on `beforeItemStack` or the slot.** `/give` also fills an empty slot, and the two cannot be told apart.
- (b) **Intercept `/give`.** Stable 2.10.0 has no before-hook for vanilla commands. `beforeEvents.chatSend` is beta (C-2), and a console or command block `/give` is never seen.
- (c) **Accept, and document `/andrew:<cmd> give` as the only test path.** That fails spec AC-2 literally.

**Consequences.**
- The recipe JSON of all three weapons changes (owned by `webs`, `scyt`/`sitm`, `orbc`). Three hidden token items are added.
- GameTests that fake a craft by inserting an unmarked `itemId` must insert the token instead. This is harness wiring, not an assertion, so `ac11` holds.
- Unmarked `andrew:web_sword` stacks already in 0.x worlds become ordinary. The craft flag is unchanged.
- A shift-click craft or the iPad craft button delivers the token straight into the inventory. The swap happens in the next `flush` tick, so the token is visible for at most one tick.
- This needs a probe (`as13`).
