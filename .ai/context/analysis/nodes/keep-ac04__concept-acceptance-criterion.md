---
type: "concept-acceptance-criterion"
node_id: "L0-keep-ac04"
source_channel: "rollout"
title: "AC K-4 — Server restart mid-cycle yields no extra copy and no lost obligation `RELEASE BLOCKER`"
aliases: ["L0-keep-ac04"]
part_of: ["L0-keep"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1362
tags: ["acceptance-criterion","anti-dup","restart","durability","blocker","L0-keep","maps:DoD"]
---

# AC K-4 — Server restart mid-cycle yields no extra copy and no lost obligation `RELEASE BLOCKER`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r002", "L0-keep-r005", "L0-keep-p003", "L0-keep-ent1"]` · `maps_to: ["§14 DoD", "WS-10", "K-6"]` · `governed_by: ["C-6", "C-7"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player who died carrying a provenance-marked `andrew:web_sword`
**WHEN** the server is stopped and restarted **before** the player respawns, and the player then rejoins
**THEN** the player receives exactly **one** `andrew:web_sword`
**AND** restarting the server again and rejoining again grants **nothing further**.

**Spec basis.** §4 (*«…и рестарте»*) · C-6 (state survives restart) · C-7.

**How to verify.** Docker BDS: scripted death → `stop` → restart → rejoin, asserting cumulative grant count == 1. Then repeat the restart/rejoin loop and assert the count is unchanged. This is the acceptance test that proves the ledger is genuinely durable rather than incidentally surviving in memory — it is the retention analogue of §13's restart test for the craft flag.

**Both directions matter.** Grant count of **2** is a dup (C-7 breach). Grant count of **0** is a silently destroyed legendary — a real defect, though the preferred one per `L0-keep-r002`.

**Blocker status.** Per KC-1.
