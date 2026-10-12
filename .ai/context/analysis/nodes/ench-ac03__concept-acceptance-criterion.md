---
type: "concept-acceptance-criterion"
node_id: "L0-ench-ac03"
source_channel: "rollout"
analysis_version: 10
title: "AC-ench-03 · Wind Burst and Unbreaking: 70/40/20 independent rolls, highest wins, capped"
aliases: ["L0-ench-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 779
tags: ["v10", "enchanting", "level-rule", "C-39", "channel:unit", "spec-5-bullet-5"]
level: 2
---
# AC-ench-03 · Wind Burst and Unbreaking: 70/40/20 independent rolls, highest wins, capped

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r005

**GIVEN** 1 000 rolls in which `wind_burst` (Mace) or `unbreaking` (pickaxe) was chosen, at tier 3,
**WHEN** the levels and the traces are counted,
**THEN**:
- the counts are III ∈ [162, 238], II ∈ [276, 364] and I ∈ [433, 527];
- every result's three level rolls are present in the trace;
- the per-roll success counts are within ±3σ of 700, 400 and 200;
- no level exceeds 3.

**AND** at tier 2 no level exceeds II and P(II) ∈ ±3σ of 0.52. At tier 1, every level is I.
**AND** the same seed reproduces an identical sequence of `EnchantRoll`s. The test runs seeded and unseeded.

**Channel:** `unit`.
