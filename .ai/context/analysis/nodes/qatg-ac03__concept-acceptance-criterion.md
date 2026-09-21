---
type: "concept-acceptance-criterion"
node_id: "L0-qatg-ac03"
source_channel: "rollout"
title: "AC Q-3 — No known duplication path across all four vectors"
aliases: ["L0-qatg-ac03"]
part_of: ["L0-qatg"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-qatg-r005", "L0-qatg-ctr1"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1245
tags: ["acceptance-criterion","dod","dup-safety","L0-qatg"]
---

# AC Q-3 — No known duplication path across all four vectors

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-r005", "L0-qatg-ctr1"]` · `maps_to: ["§14", "§4", "§12"]`

**GIVEN** the craft-completion, death, reconnect, and server-restart handlers as implemented by `L0-once` and `L0-keep`
**WHEN** each vector is exercised in isolation and in the combinations §4/§12 name (e.g. death immediately followed by restart)
**THEN** at no point does more than one legitimately-owed instance of the bonded `andrew:web_sword` exist for the same craft event
**AND** the craft flag itself is never reset by any of the four vectors (§12).

**Spec basis.** §14: *«Нет известных способов дюпа через крафт, смерть или reconnect»* — read together with §4/§12/C-7's fourth vector, restart (`L0-qatg-r005`, `L0-qatg-ctr1`).

**How to verify.** The dup-cycle GameTests already scoped by `L0-keep` (`L0-keep-ac03`, `ac04`) and `L0-once`'s craft-race/restart tests, read together as one criterion at the gate level.

**Not covered here.** Admin/`/give` copies, which are explicitly outside the one-per-world budget (§3, §4) and not a dup by definition.
