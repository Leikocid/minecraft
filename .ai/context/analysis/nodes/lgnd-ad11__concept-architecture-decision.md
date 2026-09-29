---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad11"
source_channel: "rollout"
analysis_version: 3
title: "AD-lgnd-11: `holder` is stamped on the stack at inventory events; return target is `holder ?? owner`"
aliases: ["L0-lgnd-ad11"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2292
tags: ["v3-delta", "status:proposed", "resolves:L0-xcx11", "answers:L0-xq3", "resolves:L0-lgnd-cx09"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-adr-hold", "L0-xcx11", "L0-xq3", "L0-lgnd-cx09", "L0-lgnd-ent2", "L0-lgnd-ent4", "L0-lgnd-p003", "L0-lgnd-ac18"]
---
# AD-lgnd-11: `holder` is stamped on the stack at inventory events; return target is `holder ?? owner`

**Context.**
- `L0-adr-hold` (proposed, L0) decides that loss return goes to the **last holder** (Orbital §5, "последнему владельцу" plus "not bound to the creator").
- As built, the item returns to `mark.owner` (`lgnd-cx09` item 1). That lets B "return" a traded weapon to A for free.
- This record fixes how `lgnd` realises the L0 decision.

**Decision.**
1. **Where it is stored.** `holder` and `holderName` are dynamic properties **on the ItemStack** (`ent2`), not in a world map. An item entity carries its stack, so the holder travels with it into the Void or lava with no lookup.
2. **When it is written.**
   - On `playerInventoryItemChange` for a live marked stack whose `holder` differs from the player: clone, set, write the slot.
   - Also written when `retain`/restore, a loss return, `give` and the token swap put the stack into a player's hands.
   - There is no scan and no timer (C-4).
3. **Off hand.** No inventory event fires for the Equippable slot. `holder` was already written when the stack sat in the container before it moved to the off hand. That is correct, because it is the same player.
4. **Return target** = `holder ?? owner`. v2 stacks have no holder and fall back to the crafter, which matches the as-built behaviour.
5. **Offline target.** The owed list is keyed by the target id (`ent4`), and the item is redeemed on that player's next spawn.
6. The **generation guard** (`wpn2`) is a prerequisite. Without it, a mis-classified pickup gives the new holder a live duplicate.

**Rejected.**
- (a) **A world map `instanceId → holder`.** It is one more key per instance, and it can drift from the stack, for example on a hopper transfer.
- (b) **Last entity to touch the item entity.** There is no stable event for it, and a hopper can spoof it.
- (c) **Keep the owner.** It contradicts Orbital §5.

**Open.** `L0-adr-hold` still needs the client's one-line confirmation. Until then this is `proposed`. If the client says "crafter", only item 4 changes, to `owner`.
