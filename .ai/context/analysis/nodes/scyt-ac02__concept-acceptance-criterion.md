---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac02"
source_channel: "rollout"
analysis_version: 5
title: "AC-scyt-02 — The nearest visible player wins over any mob; occluded and hidden players are skipped (§8 test 2, amended)"
aliases: ["L0-scyt-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1045
tags: ["is_a:acceptance-criterion", "spec-test:2", "channel:bds", "mob-targeting", "delta:2026-09-26"]
level: 2
---
# AC-scyt-02 — The nearest visible player wins over any mob; occluded and hidden players are skipped (§8 test 2, amended)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r001", "L0-scyt-r002", "L0-scyt-ad02", "L0-scyt-ad04"]`

GameTest: `andrew:scythe_prefers_player_over_mob` (green). The table test is `tests/scythe-targeting.test.mjs`.

**GIVEN** owner O, with player A at 8 blocks behind a stone wall, player B at 12 blocks in the open, player C at 15 blocks in the open, and a zombie at 3 blocks in the open,
**WHEN** O presses Use,
**THEN** the lock is on **B**. A is skipped because it has no LOS. The zombie is skipped because a visible player exists (player tier, `L0-scyt-ad04`).

**Variants:**
- Remove B and C, so only A (occluded) and the zombie remain → the **zombie** is locked.
- A player in another dimension is never considered.
- A player standing in tall grass or behind glass is **not** visible (`L0-scyt-ad02`).
- A Creative player in the open **is** locked (`L0-scyt-as01`).
