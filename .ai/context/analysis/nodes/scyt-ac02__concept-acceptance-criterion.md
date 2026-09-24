---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac02"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-02 — The nearest visible player is chosen; mobs, hidden and occluded players are skipped (§8 test 2)"
aliases: ["L0-scyt-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 832
tags: ["is_a:acceptance-criterion", "spec-test:2", "channel:bds"]
level: 2
---
# AC-scyt-02 — The nearest visible player is chosen; mobs, hidden and occluded players are skipped (§8 test 2)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r001", "L0-scyt-r002", "L0-scyt-ad02"]`

**GIVEN** owner O, with player A at 8 blocks behind a solid 3-high stone wall, player B at 12 blocks in the open, player C at 15 blocks in the open, and a zombie at 3 blocks,
**WHEN** O presses Use,
**THEN** the lock is on **B**: the log shows `targetId = B`. A is skipped because it is not visible, and the zombie is skipped because it is not a player.

**Variants:**
- A player in Spectator mode at 4 blocks is skipped.
- A player whose feet are behind a slab but whose head is exposed at 6 blocks **is** chosen (`L0-scyt-ad02`).
- A player in another dimension is never considered.
