---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac03"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-03 — A hidden player is not chosen (§8 test 3)"
aliases: ["L0-scyt-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 939
tags: ["is_a:acceptance-criterion", "spec-test:3", "channel:bds", "delta:2026-09-26"]
level: 2
---
# AC-scyt-03 — A hidden player is not chosen (§8 test 3)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r001", "CTR-014", "L0-scyt-gl05"]`

GameTest: `andrew:scythe_skips_hidden` (green). Manual: `/andrew:hide <seconds> [target]`.

**GIVEN** owner O, with player H at 5 blocks and `andrew:hidden_until > now`, and player V at 10 blocks, both in the open,
**WHEN** O presses Use,
**THEN** the lock is on V.

**Variants:**
- If V is absent and a cow is at 8 blocks → the **cow** is locked, because hiding removes H and leaves the mob tier.
- If V and the cow are both absent → «Здесь нет цели», with the cooldown untouched (measured on BDS).
- Vanilla Invisibility does **not** hide.

**Caveat:** the property is private to each pack. A player hidden by the release pack reads as not hidden in the GameTest pack. Verification is **at the seam**, because Shadow Blade does not exist (CTR-014).
