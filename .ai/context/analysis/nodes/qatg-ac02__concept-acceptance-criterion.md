---
type: "concept-acceptance-criterion"
node_id: "L0-qatg-ac02"
source_channel: "rollout"
title: "AC Q-2 — Full acceptance coverage, single- and multi-player"
aliases: ["L0-qatg-ac02"]
part_of: ["L0-qatg"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-qatg-ent2", "L0-qatg-r002"]
analysis_version: 2
level: 2
priority: 510
size_chars: 996
tags: ["acceptance-criterion","dod","multiplayer","L0-qatg"]
---

# AC Q-2 — Full acceptance coverage, single- and multi-player

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-ent2", "L0-qatg-r002"]` · `maps_to: ["§14", "§9"]`

**GIVEN** the completed Acceptance Matrix (`L0-qatg-ent2`) with `pending_artifact_count = 0`
**WHEN** every mapped harness mechanism is run
**THEN** all twelve rows report `green` in a single-player world
**AND** every row where §9 claims multiplayer determinism (at minimum AT-3, AT-7, AT-12) has corroborating multiplayer evidence per `L0-qatg-p003`.

**Spec basis.** §14: *«Все acceptance tests выше проходят в одиночном мире и минимум в тесте с двумя игроками.»*

**How to verify.** `L0-qatg-p002` steps 2–4.

**Not covered here.** Whether a "pass" additionally requires the pickaxe regression suite — that is a separate, unconditional pre-check (`L0-qatg-ac06`/`L0-qatg-r003`), not part of this criterion.
