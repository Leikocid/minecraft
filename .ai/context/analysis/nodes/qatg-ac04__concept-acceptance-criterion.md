---
type: "concept-acceptance-criterion"
node_id: "L0-qatg-ac04"
source_channel: "rollout"
title: "AC Q-4 — Shipped packs carry no Preview/Experiments dependency"
aliases: ["L0-qatg-ac04"]
part_of: ["L0-qatg"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-qatg-r004"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1052
tags: ["acceptance-criterion","dod","stable-api","L0-qatg"]
---

# AC Q-4 — Shipped packs carry no Preview/Experiments dependency

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-r004"]` · `maps_to: ["§14"]`

**GIVEN** `packs/behavior/manifest.json` and `packs/resource/manifest.json` after the Web Sword is merged
**WHEN** the manifests are inspected (`manifests.test.mjs`) and the world is loaded without the `Beta APIs` experiment toggled on
**THEN** the Web Sword loads and functions fully
**AND** neither manifest declares a dependency on `@minecraft/server-gametest` or any other Beta-only module.

**Spec basis.** §14: *«Нет обязательной зависимости от Experiments/Preview.»* · C-1 · `L0-qatg-r004`.

**How to verify.** Existing `manifests.test.mjs` (C-10 regression suite), extended to assert on the new Web Sword entries; a `bds:check` run with Experiments left at their default (off) state.

**Not covered here.** `packs/gametest` itself, which is dev-only by design and explicitly exempt (`L0-qatg-r004` scope note).
