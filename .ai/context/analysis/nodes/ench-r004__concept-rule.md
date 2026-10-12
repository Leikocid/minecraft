---
type: "concept-rule"
node_id: "L0-ench-r004"
source_channel: "rollout"
analysis_version: 10
title: "R-ench-004 · The 20 % rare stage"
aliases: ["L0-ench-r004"]
is_a: ["rule"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1323
tags: ["v10", "enchanting", "rare-stage", "C-39", "statistics"]
level: 2
---
# R-ench-004 · The 20 % rare stage

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-xasm39, L0-ench-gl01, L0-ench-ac02

**Rule.** For each **valid generation** (one roll result for an item whose eligible set holds at least one formerly table-inaccessible enchantment; `xasm39`):
- **with p = 0.20,** the result holds **at least one** eligible rare enchantment;
- **with p = 0.80,** it is the standard vanilla pool and holds **none**.

If the item has no eligible rare, the standard pool is used, and the generation is excluded from the 20 % statistic.

**Independence.** The rare stage is a separate draw from the level rule (`r005`). The spec says these are different stages, and the RNG draws are not shared.

**Statistic (C-39).** For n generations, the count of results with ≥ 1 rare member must fall within np ± 3√(np(1−p)):
- n = 1 000 → [162, 238];
- n = 10 000 → [1 880, 2 120].

The test runs once with a fixed seed and once unseeded. It is tested for each item class: mace, boots, a bow, a trident, and a custom def.

**Why "none" on a miss.** The spec's split is "20 % include … otherwise 80 % standard pool". If a miss could still draw a rare in the fill, the observed rate would rise above 20 % and the acceptance bullet would fail by construction.

**Source:** spec v2 §4 Distribution; §5 bullet 4.
