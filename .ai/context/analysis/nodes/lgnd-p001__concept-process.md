---
type: "concept-process"
node_id: "L0-lgnd-p001"
source_channel: "rollout"
analysis_version: 1
title: "P-lgnd-001: Craft gate, refund and first-craft broadcast (per weapon)"
aliases: ["L0-lgnd-p001"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1980
tags: ["process", "craft-gate", "refund"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r002", "L0-lgnd-ent1", "L0-lgnd-ent2", "L0-sitm"]
---
# P-lgnd-001: Craft gate, refund and first-craft broadcast (per weapon)

Generalised from `src/websword/craftgate.ts`. The stable 2.10.0 API has no "before craft" event, so the gate decides after the fact (Q-008).

1. **Detect.** `playerInventoryItemChange` shows a stack whose `typeId` is a registered `def.id` and which has **no** mark. Queue `(playerId, def.id)`. Schedule one `system.run(flush)` per tick. A craft touches several slots, and each touch is its own event.
2. **Flush sequentially.** Process queued players in event order. Skip invalid (left) players. Wrap each player in try/catch so one failure does not swallow the queue. The flag is re-read per stack, so exactly one of two same-tick crafters claims (Web Sword §9 race).
3. **Scan that one inventory** for unmarked stacks of that weapon. This runs only on the event, never per tick (C-4). Call the pure `craftDecision({ crafted: isCrafted(def), gameMode, marked: false })`:
   - `ignore`: Creative/Spectator. The stack stays unmarked and is an ordinary item.
   - `claim`: stamp `makeMark("craft", player)` with `gen = 0`, write the slot, **then** `setCrafted(def, name)`, then broadcast `def.announceKey` with nested `[player name, translate def.nameKey]`, falling back to the plain-name form if the nested form throws. Stamp-before-flag is load-bearing: a throw leaves the budget unspent.
   - `refund`: blank the slot, `addItem` each of `def.refundIngredients` (spawn leftovers at the player's feet), send `def.messageKeys.blocked`, and log.
4. **Known limit (kept):** the refunded base tool (Diamond Sword / Diamond Hoe) is a new stack. Enchantments and durability of the consumed one are not restored.

Vanilla `/give` in Survival is indistinguishable from a craft, and so it claims or is refunded. The operator path is `give` in `L0-lgnd-p007`, as README documents for the Web Sword.
