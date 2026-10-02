---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac09"
source_channel: "rollout"
analysis_version: 5
title: "AC-orbc-09 · One activation per tick; the target is locked; hits count on any face `[bds]`"
aliases: ["L0-orbc-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 885
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-orbc-r006", "relates_to:L0-orbc-r003", "relates_to:L0-orbc-ent2"]
level: 2
---
# AC-orbc-09 · One activation per tick; the target is locked; hits count on any face `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r006", "L0-orbc-r003", "L0-orbc-ent2"]`

1. **Dedup.** P's handlers receive `itemUse`, `itemUseOn` and `entityHitBlock` for the same tick. The test drives the core's input entry with three synthetic calls. Exactly one attack is registered, and its mode is the first call's.
2. **Lock.** P fires at T. On the next tick P turns 180° and moves 5 blocks. The charge's (x, z) still equals T's column, and `onDetonate.point` equals T.
3. **Faces.** P looks at T's bottom face from a cave below, at T's side from 4 blocks, and at the top from above. Each gives `target == T.location`, not the adjacent air block.
4. **Passable.** Tall grass stands in front of stone S at a distance of 6. The target is S.
