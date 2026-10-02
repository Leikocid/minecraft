---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac17"
source_channel: "rollout"
analysis_version: 5
title: "AC-scyt-17 — A lone mob is targeted, visibly hurt, and takes the full volley"
aliases: ["L0-scyt-ac17"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 968
tags: ["is_a:acceptance-criterion", "channel:bds", "mob-targeting", "delta:2026-09-26"]
level: 2
---
# AC-scyt-17 — A lone mob is targeted, visibly hurt, and takes the full volley

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-ad04", "L0-scyt-ad06", "L0-scyt-r005"]`

GameTest: `andrew:scythe_hits_mob_when_alone` (green since `4b74f2f`; hurt assertion since `302fba4`).

**GIVEN** owner O and one cow (10 HP) at about 6 blocks in the open, with no other player within 20 blocks,
**WHEN** O presses Use,
**THEN**:
- the log shows `targets minecraft:cow`;
- hit 1 leaves exactly 7 HP, and the engine's `entityHurt` event fires for the cow, which gives the red flash and sound;
- each hit launches the cow;
- after ≥ 1 hit, the owner's cooldown is the full 30 s.

**Also:** measured on BDS, 10 → 7 → 4 → 1, and then the fall kills the cow. The end is `spent` with hits = 3.

**Test hygiene:** run it with no real player connected to the shared BDS container, because a connected player outranks the cow and fails the test.
