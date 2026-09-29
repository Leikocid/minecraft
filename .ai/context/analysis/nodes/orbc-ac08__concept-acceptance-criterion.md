---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac08"
source_channel: "rollout"
analysis_version: 3
title: "AC-orbc-08 · Touch input and aim on the iPad `[ipad]` (manual)"
aliases: ["L0-orbc-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1076
tags: ["is_a:acceptance-criterion", "channel:ipad", "manual", "relates_to:L0-xcx8", "relates_to:L0-orbc-cx02", "relates_to:L0-xasm10", "blocked:L0-xq5"]
level: 2
---
# AC-orbc-08 · Touch input and aim on the iPad `[ipad]` (manual)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx8", "L0-orbc-cx02", "L0-xasm10", "L0-orbc-ad01"]`

**Blocked** until `L0-xq5` is answered. The THEN lines below are for option 1 (LMB within reach, RMB up to 10). Rewrite them if the answer is different.

On the iPad with the default touch controls, using the stub effect (one sound at detonation):
1. **Tap** on a highlighted block 3 blocks away → one RMB attack lands on **that** block, the tapped one.
2. **Hold** on a highlighted block 3 blocks away → one LMB attack. The block is not mined, even when the hold continues.
3. A block 8 blocks away with RMB (by the gesture that `cx02` settles) → the attack lands on the block under the crosshair/aim.
4. Each gesture gives exactly one attack and one cooldown. There is never a double shot from tap-plus-hold (`r006`).
5. Tapping the sky gives no sound, no text and no HUD change.

Record the actual outcome of each case in the task, and the deviation note (`r013`).
