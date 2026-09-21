---
type: "concept-acceptance-criterion"
node_id: "L0-keep-ac02"
source_channel: "rollout"
title: "AC K-2 — Restored to the same owner, exactly once"
aliases: ["L0-keep-ac02"]
part_of: ["L0-keep"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1029
tags: ["acceptance-criterion","respawn","gametest","L0-keep","maps:AT-11"]
---

# AC K-2 — Restored to the same owner, exactly once

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r002", "L0-keep-p002"]` · `maps_to: ["§13 AT-11", "WS-9"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player who died carrying a provenance-marked `andrew:web_sword`
**WHEN** the player respawns
**THEN** the player's inventory contains **exactly one** `andrew:web_sword`
**AND** it carries the same provenance marker it had before death
**AND** the world-wide count of that bonded instance is exactly one.

**Spec basis.** §13: *«…и возвращается без дюпа»* · §4: *«После возрождения предмет должен вернуться тому же владельцу.»*

**How to verify.** GameTest, simulated player. Assert inventory count **== 1**, not **>= 1** — the "at least one" assertion passes on a duplicate and is the easy way to ship the exact bug this component exists to prevent.

**Also assert.** No second player received a copy, and no item entity exists in the world (composes with `L0-keep-ac01`).
