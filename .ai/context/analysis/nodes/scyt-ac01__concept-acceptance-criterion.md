---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac01"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-01 — Nothing to target within 20 blocks: message shown, no cooldown (§8 test 1, amended)"
aliases: ["L0-scyt-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 898
tags: ["is_a:acceptance-criterion", "spec-test:1", "channel:bds", "delta:2026-09-26"]
level: 2
---
# AC-scyt-01 — Nothing to target within 20 blocks: message shown, no cooldown (§8 test 1, amended)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r003"]`

GameTest: `andrew:scythe_no_target_no_cooldown` (green).

**GIVEN** owner O holds a ready Scythe, and there is **no visible player and no visible living mob** within 20 blocks (the nearest is at 25 blocks, behind a wall, or hidden),
**WHEN** O presses Use,
**THEN**:
- O's action bar shows `andrew.scythe.no_target`: «Здесь нет цели» / "There is no target here";
- the cooldown `andrew:cd_scythe_of_calamity` is unchanged, busy is false, and no volley exists (`activeVolleyCount() === 0`);
- a second press in the next tick behaves the same way.

**Changed from before:** a zombie or villager 5 blocks away in the open **is** now targeted (`L0-scyt-ac17`), so it no longer leads to "no target".
