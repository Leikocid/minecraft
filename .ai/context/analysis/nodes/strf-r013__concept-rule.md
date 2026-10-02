---
type: "concept-rule"
node_id: "L0-strf-r013"
source_channel: "rollout"
analysis_version: 5
title: "Rule: the Nether floor probe (a lava ocean is never a floor)"
aliases: ["L0-strf-r013"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 991
tags: ["is_a:rule", "nether", "validity", "relates_to:L0-bast", "relates_to:L0-xasm4"]
level: 2
---
# Rule: the Nether floor probe (a lava ocean is never a floor)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- `getTopmostBlock` is **not** used in the Nether, because it returns the bedrock roof. For each sample column, scan **downward from Y = 110** to Y = 32 and find the first `air → solid` transition, where solid means non-liquid, not `bedrock`, and has a collision shape. That Y is the column's floor.
- A column is a **lava-ocean column** if the first non-air block below the scan start is `lava` at Y ≤ 32 (the Nether lava sea is at 31). One such column in the inner 60 % of the footprint rejects the candidate (§14.2, test 52).
- The candidate floor is the **median** floor Y. It is valid if ≥ 80 % of samples have a floor within ±3 of the median (`L0-xasm4` §3). The template sits on that Y. Netherrack or air inside the AABB is replaced by the template.
- The AABB must not reach Y ≥ 122 (`L0-strf-r003`).
- Every Nether biome is eligible (§14.2). Biome is not checked.
