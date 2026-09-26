---
type: "concept-rule"
node_id: "L0-wind-r009"
source_channel: "rollout"
analysis_version: 2
title: "Rule: level the ~35×35 plot and blend its edges — no square platform with vertical walls"
aliases: ["L0-wind-r009"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 989
tags: ["is_a:rule", "spawn-windmill", "site-prep", "edge-smoothing", "relates_to:L0-wind-p003", "relates_to:L0-wind-as03"]
level: 2
---
# Rule: level the ~35×35 plot and blend its edges — no square platform with vertical walls

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p003, L0-wind-e004, L0-wind-as03]`

**Source:** §4.7 item 11, §9 edge case 2, §12 bullet 2.

- The 35×35 plot is levelled to one target Y (the median natural surface).
- Around it, a **blend band** of width `B` (`L0-wind-as03`) interpolates from the target Y to the untouched natural surface.
- After prep, for every pair of horizontally adjacent columns in plot + band: `|Δy| ≤ 1`, except where the natural terrain outside the band already had larger steps.
- Band surfaces reuse the local surface block family (grass on grass, sand on sand), so the seam is not a visible colour ring.
- If Δ between target Y and natural terrain exceeds what `B` can absorb at slope 1, the candidate's score is penalised; the search prefers another site. If it is still chosen, the band grows (up to `Bmax`) rather than leaving a wall.
