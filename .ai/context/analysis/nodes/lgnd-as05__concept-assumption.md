---
type: "concept-assumption"
node_id: "L0-lgnd-as05"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-as05"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 523
tags: ["assumption", "CAN_ASSUME", "C-10"]
level: 2
---
**ASM-lgnd-05: Unmarked (Creative) copies keep casting.**

The shipped `trap.ts` checks only `isWebSword`, never the mark. `src/gametest/main.ts` hands out unmarked `new ItemStack(WEB_SWORD_ID)` for the trap scenarios (checked). So the dispatcher treats an unmarked legendary as castable, with its cooldown keyed by the player. Only *stale* marked stacks are barred.

**Impact if wrong:** requiring a mark to cast would break the Web Sword trap GameTests (C-10). It would also make Creative testing on the iPad impossible.
