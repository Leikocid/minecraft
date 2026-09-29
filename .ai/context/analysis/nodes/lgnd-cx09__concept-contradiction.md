---
type: "concept-contradiction"
node_id: "L0-lgnd-cx09"
source_channel: "rollout"
analysis_version: 3
title: "CX-lgnd-09 · Loss return in code: owner instead of last holder, and no generation guard"
aliases: ["L0-lgnd-cx09"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 530
size_chars: 2171
tags: ["is_a:contradiction", "source-vs-code", "anti-dup", "status:open"]
level: 2
---
---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-ad02", "L0-lgnd-ent2", "L0-lgnd-ent4", "L0-lgnd-cx02", "L0-lgnd-ac08", "L0-lgnd-ac10"]
status: open
category: source-vs-code
---
# CX-lgnd-09 · Loss return in code: owner instead of last holder, and no generation guard

**Spec/design.**
- Scythe §1: *«возвращается последнему владельцу»* ("returns to the last owner").
- decision-legendary-rules-obschie: the item goes "последнему владельцу" ("to the last owner").
- `L0-lgnd-ad02`, `r005`, `ent2`, `ac08` and `ac10` design a `holder` field plus a `gen` bump, so a mis-classified survivor becomes stale.

**Code** (`src/legendary/recovery.ts`, `state.ts`):
1. The return target is `mark.owner`, which is the crafter or the admin recipient. There is no `holder` field. If a crafter gives the sword to a friend and the friend drops it into the Void, the sword goes back to the crafter.
2. There is no generation. Mis-classification is reduced by heuristics instead:
   - an inventory scan of online players;
   - a scan of the container at or below the spot (hopper);
   - a check of the other watched entities.

   A pickup that none of these see (an allay, a hopper minecart, a hopper chain that moves the item on within 40 ticks, a fox) is classed as lost. The owner gets a copy with the **same id**, and the survivor stays fully live. That is a real duplicate (C-7), not the harmless stale copy that `cx02` assumed.
3. `_owed` is a map `ownerId → one mark`. Two losses of different admin copies by the same offline owner overwrite each other, so one debt is lost.
4. A pickup is also inferred by scanning every online player's inventory at classification time. That is event-scoped and bounded, but it is a scan wider than the "one inventory" wording of C-5.

**Resolution needed.**
- (a) Implement `holder` and `gen` as designed.
- (b) Accept the as-built behaviour: owner-return, a small dup window, and a debt-overwrite edge. `ac08` and `ac10` are then rewritten, and `cx02` is re-framed as a dup risk.

Also, the spec's "последнему владельцу" needs a client reading: does it mean the crafter or the last holder?
