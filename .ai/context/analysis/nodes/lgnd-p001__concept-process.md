---
type: "concept-process"
node_id: "L0-lgnd-p001"
source_channel: "rollout"
analysis_version: 3
title: "P-lgnd-001: Craft gate, refund and first-craft broadcast (per weapon, token-based in v3)"
aliases: ["L0-lgnd-p001"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2293
tags: ["v3-delta", "craft-gate"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r002", "L0-lgnd-r014", "L0-lgnd-ad08", "L0-lgnd-ent1", "L0-lgnd-ent2", "L0-xcx9"]
---
# P-lgnd-001: Craft gate, refund and first-craft broadcast (per weapon, token-based in v3)

`src/legendary/craftgate.ts`. There is no craft event in stable 2.10.0, so the gate decides after the fact (Q-008). v3 changes **what** it watches (`ad08`).

1. **Detect.** `playerInventoryItemChange` with `itemStack.typeId == def.craftTokenId` for some def.
   - Queue the player id.
   - Schedule one `system.run(flush)`.
   - A SimulatedPlayer with no readable `player` is skipped, and the GameTest pack arms its own gate (as built).
   - **v2 behaviour removed:** an unmarked `def.itemId` stack is no longer queued (`r014`).
2. **Flush sequentially.** This is as built:
   - Players are processed in event order.
   - Players who left are skipped.
   - Each player is wrapped in try/catch.
   - The flag is re-read for every token, so exactly one of two crafters in the same tick claims.
3. **Scan that one inventory for tokens.** Each token goes through `craftDecision({crafted, gameMode, marked: false})`:
   - `ignore` (Creative/Spectator): replace the token in the same slot with an **unmarked** `def.itemId`. The flag is untouched.
   - `claim`:
     - replace it with a `def.itemId` stamped `{origin: craft, owner, ownerName, id, gen: 0, holder, holderName}`;
     - **then** `setCrafted(def, name)`;
     - **then** broadcast `<textPrefix>.first_craft` with `[player name, translate nameKey]`.
     - Stamp-before-flag is kept: a throw leaves the budget unspent and the token in place, and the next flush retries.
   - `refund`: blank the token slot, `addItem` each `def.refund` pair and spill any leftovers at the feet, then send `<textPrefix>.craft_blocked`.
4. **Tokens outside a player inventory** (chest, crafter output, ground) are inert until a player receives one.
5. **Known limit, kept.** The refunded base tool (Diamond Sword, Diamond Hoe, Fishing Rod) is a new stack. The consumed tool's enchantments and durability are lost.

For the Cannon, `refund` = TNT ×4 + Fishing Rod ×1, and the broadcast is `andrew.orbital.first_craft`.

The operator path `/andrew:<cmd> give` still stamps `origin: admin` and never touches the flag.
