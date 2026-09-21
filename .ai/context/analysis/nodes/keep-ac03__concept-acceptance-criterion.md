---
type: "concept-acceptance-criterion"
node_id: "L0-keep-ac03"
source_channel: "rollout"
title: "AC K-3 — Disconnect/reconnect cycling yields no extra copy `RELEASE BLOCKER`"
aliases: ["L0-keep-ac03"]
part_of: ["L0-keep"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1402
tags: ["acceptance-criterion","anti-dup","reconnect","blocker","L0-keep","maps:DoD"]
---

# AC K-3 — Disconnect/reconnect cycling yields no extra copy `RELEASE BLOCKER`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r002", "L0-keep-p003"]` · `maps_to: ["§14 DoD", "WS-10"]` · `governed_by: ["C-7"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player who died carrying a provenance-marked `andrew:web_sword` and disconnected **before respawning**
**WHEN** the player reconnects, and then disconnects and reconnects **N more times** (N ≥ 3)
**THEN** the player has received exactly **one** `andrew:web_sword` in total across all sessions
**AND** no item entity was dropped at any point.

**Spec basis.** §4: *«…при смерти, disconnect/reconnect и рестарте»* · §14: *«Нет известных способов дюпа через… смерть или reconnect.»* · C-7.

**How to verify.** GameTest / BDS scripted session cycling. The N-times repetition is the point: a naive "grant on join if owed" implementation passes a single-cycle test and fails this one. Assert the **cumulative** grant count, not the final inventory — a player who drops the extra copy in a chest between cycles still represents a dup.

**Variants to cover.** Disconnect *during* the death animation; disconnect *after* respawn but before the grant lands; reconnect while the previous session is still registered.

**Blocker status.** Per KC-1, a failure here is not shippable at any severity discount.
