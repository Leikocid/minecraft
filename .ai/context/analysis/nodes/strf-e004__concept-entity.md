---
type: "concept-entity"
node_id: "L0-strf-e004"
source_channel: "rollout"
analysis_version: 2
title: "Entity — `DeviationEntry` (one row of `docs/structures/deviations.md`)"
aliases: ["L0-strf-e004"]
is_a: ["entity"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 824
tags: ["is_a:entity", "deviation-report", "relates_to:L0-strf-r012"]
level: 2
---
# Entity — `DeviationEntry` (one row of `docs/structures/deviations.md`)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

| Field | Example |
|---|---|
| `id` | `DEV-STRF-01` |
| `spec` | §7, §2 ("генерация при worldgen") |
| `exact rule` | quoted RU sentence + EN gist |
| `implemented as` | "Generated on first player discovery of the chunk" |
| `why` | "Stable API 2.10.0 has no chunk-generated event; jigsaw worldgen is experimental (C-2)" |
| `player-visible effect` | "Possible pop-in at the edge of view; trees in the footprint removed" |
| `evidence` | probe item / test id / commit |
| `owner` | strf / loot / wind / airs / wrdn / bast |
| `status` | active / resolved-by-engine-update |

The report opens with a summary table of all entries and is linked from the README (§11 "краткий технический отчёт").
