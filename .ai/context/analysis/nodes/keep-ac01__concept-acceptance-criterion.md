---
type: "concept-acceptance-criterion"
node_id: "L0-keep-ac01"
source_channel: "rollout"
title: "AC K-1 — No ground drop on death"
aliases: ["L0-keep-ac01"]
part_of: ["L0-keep"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1069
tags: ["acceptance-criterion","death","gametest","L0-keep","maps:AT-11"]
---

# AC K-1 — No ground drop on death

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r001", "L0-keep-p001"]` · `maps_to: ["§13 AT-11", "WS-9"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player holding a provenance-marked `andrew:web_sword`
**WHEN** the player dies by any cause (fall, mob, PvP, `/kill`, void)
**THEN** no `andrew:web_sword` item entity exists in the world at the death location — checked on the death tick and again after the drop-collection window
**AND** no other player is able to pick one up at that location.

**Spec basis.** §13: *«После смерти владельца Web Sword не остаётся дропом на земле…»* · §4.

**How to verify.** GameTest with a simulated player on Docker BDS (KC-8, C-11). Kill the player, then assert zero matching item entities in the test volume. Sample on the death tick specifically — a transient drop that is removed a tick later still **fails**, because the window is exploitable (`L0-keep-r001`).

**Not covered here.** Whether the sword comes back — that is `L0-keep-ac02`.
