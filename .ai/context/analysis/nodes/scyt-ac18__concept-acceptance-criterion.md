---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac18"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-18 — A far visible player outranks a near mob; a hidden player drops to the mob tier"
aliases: ["L0-scyt-ac18"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 842
tags: ["is_a:acceptance-criterion", "channel:bds", "channel:unit", "mob-targeting", "delta:2026-09-26"]
level: 2
---
# AC-scyt-18 — A far visible player outranks a near mob; a hidden player drops to the mob tier

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r002", "L0-scyt-ad04"]`

Table test: `pickTarget` tier rows. GameTest: `andrew:scythe_prefers_player_over_mob`.

**GIVEN** owner O, with a cow at 2 blocks and player P at 18 blocks, both visible,
**WHEN** O presses Use, **THEN** the lock is on P.

**GIVEN** the same scene, but P is behind a wall, **THEN** the lock is on the cow. An occluded player does not block the mob tier.

**GIVEN** the same scene, but P is hidden (`andrew:hidden_until > now`), **THEN** the lock is on the cow.

**GIVEN** a cow at 2 blocks and a zombie at 2.3 blocks, with the owner facing the zombie, **THEN** the lock is on the zombie (a gaze tie-break within the mob tier).
